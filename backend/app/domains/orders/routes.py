import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from typing import Optional

import mercadopago
from sqlalchemy import func

from app.config import settings
from app.database import get_db
from app.auth import get_current_user
from app.domains.users.models import User
from app.domains.orders.models import Category, Product, OptionGroup, Option, OrderStatus, Favorite, Order, OrderItem
from app.domains.orders.schemas import (
    CategoryResponse,
    ProductListResponse,
    ProductDetailResponse,
    OrderCreate,
    OrderResponse,
    OrderListResponse,
    TopProductResponse,
    PayPreferenceResponse,
)
from app.domains.orders.repository import OrderRepository

logger = logging.getLogger(__name__)
router = APIRouter()


# ============================================================================
# Category Endpoints
# ============================================================================

@router.get("/categories", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.sort_order).all()


# ============================================================================
# Product Endpoints
# ============================================================================

@router.get("/products", response_model=list[ProductListResponse])
def list_products(
    category_id: Optional[int] = Query(None),
    is_active: bool = Query(True),
    db: Session = Depends(get_db),
):
    q = db.query(Product).filter(Product.is_active == is_active)
    if category_id is not None:
        q = q.filter(Product.category_id == category_id)
    return q.order_by(Product.category_id, Product.name).all()


@router.get("/products/{product_id}", response_model=ProductDetailResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(joinedload(Product.option_groups).joinedload(OptionGroup.options))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    for group in product.option_groups:
        group.options = sorted(group.options, key=lambda o: o.sort_order)
    product.option_groups = sorted(product.option_groups, key=lambda g: g.sort_order)

    return product


# ============================================================================
# Order Endpoints
# ============================================================================

@router.post("/orders", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not data.items:
        raise HTTPException(status_code=400, detail="Pedido deve ter ao menos 1 item")

    items_data = []
    subtotal_cents = 0

    for item in data.items:
        product = (
            db.query(Product)
            .options(joinedload(Product.option_groups).joinedload(OptionGroup.options))
            .filter(Product.id == item.product_id, Product.is_active == True)
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=400,
                detail=f"Produto {item.product_id} não encontrado ou inativo",
            )

        # Build option lookup map for this product
        valid_options: dict[int, Option] = {
            opt.id: opt
            for group in product.option_groups
            for opt in group.options
            if opt.is_active
        }

        unit_price = product.base_price_cents
        options_data = []

        for opt_req in item.options:
            opt = valid_options.get(opt_req.option_id)
            if not opt:
                raise HTTPException(
                    status_code=400,
                    detail=f"Opção {opt_req.option_id} não pertence ao produto {item.product_id}",
                )
            unit_price += opt.price_delta_cents
            options_data.append({
                "option_id": opt.id,
                "option_name_snapshot": opt.name,
                "price_delta_cents": opt.price_delta_cents,
            })

        subtotal_cents += unit_price * item.quantity
        items_data.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "unit_price_cents": unit_price,
            "name_snapshot": product.name,
            "options": options_data,
        })

    repo = OrderRepository(db)
    order = repo.create(
        user_id=current_user.id,
        items_data=items_data,
        notes=data.notes,
        subtotal_cents=subtotal_cents,
        total_cents=subtotal_cents,
    )
    return order


@router.get("/orders", response_model=list[OrderListResponse])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = OrderRepository(db)
    return repo.get_by_user(current_user.id)


@router.get("/orders/top-product", response_model=TopProductResponse)
def get_top_product(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(
            OrderItem.product_id,
            OrderItem.name_snapshot,
            func.sum(OrderItem.quantity).label("total_quantity"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.user_id == current_user.id)
        .group_by(OrderItem.product_id, OrderItem.name_snapshot)
        .order_by(func.sum(OrderItem.quantity).desc())
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Nenhum pedido encontrado")
    return TopProductResponse(
        product_id=row.product_id,
        name=row.name_snapshot,
        total_quantity=row.total_quantity,
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    repo = OrderRepository(db)
    order = repo.get_by_id(order_id, user_id=current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return order


# ============================================================================
# Favorites Endpoints
# ============================================================================

@router.get("/favorites", response_model=list[ProductListResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorites = db.query(Favorite).filter(Favorite.user_id == current_user.id).all()
    if not favorites:
        return []
    product_ids = [f.product_id for f in favorites]
    return db.query(Product).filter(Product.id.in_(product_ids), Product.is_active == True).all()


@router.post("/favorites/{product_id}", status_code=201)
def add_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    exists = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id,
    ).first()

    if not exists:
        db.add(Favorite(user_id=current_user.id, product_id=product_id))
        db.commit()

    return {"status": "ok"}


@router.delete("/favorites/{product_id}")
def remove_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id,
    ).delete()
    db.commit()
    return {"status": "ok"}


# ============================================================================
# Payment Endpoints
# ============================================================================

@router.post("/orders/{order_id}/pay", response_model=PayPreferenceResponse)
def create_payment_preference(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.MP_ACCESS_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Pagamento não configurado. Adicione MP_ACCESS_TOKEN no .env",
        )

    repo = OrderRepository(db)
    order = repo.get_by_id(order_id, user_id=current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    if order.status != OrderStatus.PENDING_PAYMENT:
        raise HTTPException(
            status_code=400,
            detail=f"Pedido não está aguardando pagamento (status: {order.status})",
        )

    sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

    preference_data = {
        "items": [
            {
                "title": item.name_snapshot,
                "quantity": item.quantity,
                "unit_price": round(item.unit_price_cents / 100, 2),
                "currency_id": "BRL",
            }
            for item in order.items
        ],
        "payer": {"email": current_user.email},
        "external_reference": str(order.id),
        "notification_url": f"{settings.APP_BASE_URL}/api/webhooks/mercadopago",
        "back_urls": {
            "success": f"{settings.APP_BASE_URL}/payment/success",
            "failure": f"{settings.APP_BASE_URL}/payment/failure",
            "pending": f"{settings.APP_BASE_URL}/payment/pending",
        },
    }

    result = sdk.preference().create(preference_data)
    if result["status"] not in (200, 201):
        logger.error("MP preference creation failed", extra={"response": result})
        raise HTTPException(status_code=502, detail="Erro ao criar preferência de pagamento")

    preference = result["response"]
    repo.set_payment_preference(order.id, preference["id"])

    return PayPreferenceResponse(
        init_point=preference["init_point"],
        sandbox_init_point=preference["sandbox_init_point"],
        preference_id=preference["id"],
    )


# ============================================================================
# Webhook — Mercado Pago
# ============================================================================

@router.post("/webhooks/mercadopago", status_code=200)
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Recebe notificações do Mercado Pago.
    Esta é a ÚNICA fonte de verdade para status de pagamento.

    Para testar localmente, expor com ngrok:
        ngrok http 8000
    E atualizar APP_BASE_URL no .env com a URL do ngrok.
    """
    try:
        body = await request.json()
    except Exception:
        return {"status": "ignored"}

    if body.get("type") != "payment":
        return {"status": "ignored"}

    if not settings.MP_ACCESS_TOKEN:
        return {"status": "ignored"}

    payment_id = body.get("data", {}).get("id")
    if not payment_id:
        return {"status": "ignored"}

    try:
        sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
        payment_info = sdk.payment().get(payment_id)
        payment_data = payment_info["response"]

        mp_status = payment_data.get("status")
        external_ref = payment_data.get("external_reference")
        if not external_ref:
            return {"status": "ignored"}

        order_id = int(external_ref)
        repo = OrderRepository(db)

        repo.confirm_payment(
            order_id=order_id,
            mp_payment_id=str(payment_id),
            mp_status=mp_status,
        )

        if mp_status == "approved":
            try:
                repo.update_status(order_id, "paid")
            except ValueError:
                pass  # Já estava em outro estado

        logger.info("MP webhook processed", extra={
            "order_id": order_id,
            "mp_status": mp_status,
        })

    except Exception as e:
        logger.error("MP webhook error", extra={"error": str(e)})

    return {"status": "ok"}
