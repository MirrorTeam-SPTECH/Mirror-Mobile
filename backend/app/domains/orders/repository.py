from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session, joinedload

from app.domains.orders.models import (
    Order, OrderItem, OrderItemOption, Payment, OrderStatus,
)
from app.domains.orders.services import generate_pickup_code, validate_status_transition


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, order_id: int, user_id: Optional[int] = None) -> Optional[Order]:
        q = (
            self.db.query(Order)
            .options(
                joinedload(Order.items).joinedload(OrderItem.options),
                joinedload(Order.payment),
            )
            .filter(Order.id == order_id)
        )
        if user_id is not None:
            q = q.filter(Order.user_id == user_id)
        return q.first()

    def get_by_user(self, user_id: int) -> list[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .all()
        )

    def create(
        self,
        user_id: int,
        items_data: list[dict],
        notes: Optional[str],
        subtotal_cents: int,
        total_cents: int,
    ) -> Order:
        order = Order(
            user_id=user_id,
            status=OrderStatus.PENDING_PAYMENT,
            pickup_code=generate_pickup_code(),
            subtotal_cents=subtotal_cents,
            total_cents=total_cents,
            notes=notes,
        )
        self.db.add(order)
        self.db.flush()

        for item_data in items_data:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                unit_price_cents=item_data["unit_price_cents"],
                name_snapshot=item_data["name_snapshot"],
            )
            self.db.add(order_item)
            self.db.flush()

            for opt in item_data["options"]:
                self.db.add(OrderItemOption(
                    order_item_id=order_item.id,
                    option_id=opt["option_id"],
                    option_name_snapshot=opt["option_name_snapshot"],
                    price_delta_cents=opt["price_delta_cents"],
                ))

        self.db.add(Payment(
            order_id=order.id,
            status="pending",
            amount_cents=total_cents,
        ))

        self.db.commit()
        return self.get_by_id(order.id)

    def update_status(self, order_id: int, new_status: str) -> Optional[Order]:
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None
        if not validate_status_transition(order.status, new_status):
            raise ValueError(f"Transição inválida: {order.status} → {new_status}")
        order.status = new_status
        self.db.commit()
        return order

    def set_payment_preference(self, order_id: int, mp_preference_id: str):
        payment = self.db.query(Payment).filter(Payment.order_id == order_id).first()
        if payment:
            payment.mp_preference_id = mp_preference_id
            self.db.commit()

    def confirm_payment(self, order_id: int, mp_payment_id: str, mp_status: str):
        payment = self.db.query(Payment).filter(Payment.order_id == order_id).first()
        if payment:
            payment.mp_payment_id = mp_payment_id
            payment.status = mp_status
            if mp_status == "approved":
                payment.paid_at = datetime.utcnow()
            self.db.commit()
