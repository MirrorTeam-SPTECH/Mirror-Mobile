"""
SQLAlchemy models for orders domain.

All price fields are stored as INTEGER in cents (never float).
"""
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
    CheckConstraint, Enum, Index
)
from sqlalchemy.orm import relationship

from app.database import Base


class OrderStatus(str, PyEnum):
    """Order status enum with state machine validation"""
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Category(Base):
    """
    Product categories.

    Examples: Hambúrgueres, Bebidas, Acompanhamentos, Sobremesas, Combos
    """
    __tablename__ = "category"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    sort_order = Column(Integer, nullable=False, default=0)

    # Relationships
    products = relationship("Product", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name})>"


class Product(Base):
    """
    Products (lanches).

    Base price is stored in CENTS (int).
    """
    __tablename__ = "product"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("category.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    base_price_cents = Column(Integer, nullable=False)  # Price in cents!
    image_url = Column(String(500), nullable=True)
    prep_minutes = Column(Integer, nullable=False, default=15)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    category = relationship("Category", back_populates="products")
    option_groups = relationship("OptionGroup", back_populates="product")
    product_ingredients = relationship("ProductIngredient", back_populates="product")
    favorites = relationship("Favorite", back_populates="product")

    def __repr__(self):
        return f"<Product(id={self.id}, name={self.name}, price_cents={self.base_price_cents})>"


class OptionGroup(Base):
    """
    Customization groups for products.

    Example: "Tipo de queijo" (required, min=1, max=1)
             "Extras" (optional, min=0, max=5)
    """
    __tablename__ = "option_group"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)
    name = Column(String(100), nullable=False)
    min_select = Column(Integer, nullable=False, default=0)
    max_select = Column(Integer, nullable=False, default=1)
    is_required = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)

    # Relationships
    product = relationship("Product", back_populates="option_groups")
    options = relationship("Option", back_populates="option_group")

    def __repr__(self):
        return f"<OptionGroup(id={self.id}, name={self.name}, product_id={self.product_id})>"


class Option(Base):
    """
    Individual customization options.

    price_delta_cents can be positive (add) or negative (remove).
    ingredient_id and grams are optional - only if option affects nutrition.
    """
    __tablename__ = "option"

    id = Column(Integer, primary_key=True, index=True)
    option_group_id = Column(Integer, ForeignKey("option_group.id"), nullable=False)
    name = Column(String(100), nullable=False)
    price_delta_cents = Column(Integer, nullable=False, default=0)  # Delta in cents
    ingredient_id = Column(Integer, ForeignKey("ingredient.id"), nullable=True)
    grams = Column(Integer, nullable=True)  # Can be negative to remove
    is_active = Column(Boolean, nullable=False, default=True)
    sort_order = Column(Integer, nullable=False, default=0)

    # Relationships
    option_group = relationship("OptionGroup", back_populates="options")
    ingredient = relationship("Ingredient")

    def __repr__(self):
        return f"<Option(id={self.id}, name={self.name}, price_delta_cents={self.price_delta_cents})>"


class Order(Base):
    """
    Customer orders.

    Status follows state machine:
    pending_payment → paid → preparing → ready → delivered
           ↓          ↓         ↓         ↓
         cancelled  (can cancel from any state except delivered)

    All prices in CENTS.
    """
    __tablename__ = "order"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    status = Column(
        Enum(OrderStatus),
        nullable=False,
        default=OrderStatus.PENDING_PAYMENT,
        index=True
    )
    pickup_code = Column(String(10), nullable=True, unique=True, index=True)
    subtotal_cents = Column(Integer, nullable=False)
    total_cents = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status={self.status}, total_cents={self.total_cents})>"


class OrderItem(Base):
    """
    Individual items in an order.

    Snapshots unit_price_cents and name_snapshot at time of order.
    This ensures price history is never rewritten when product prices change.
    """
    __tablename__ = "order_item"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("order.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("product.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price_cents = Column(Integer, nullable=False)  # Snapshot at order time
    name_snapshot = Column(String(255), nullable=False)  # Snapshot at order time

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    options = relationship("OrderItemOption", back_populates="order_item")

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, name={self.name_snapshot})>"


class OrderItemOption(Base):
    """
    Selected options for an order item.

    Snapshots option_name and price_delta_cents at time of order.
    """
    __tablename__ = "order_item_option"

    id = Column(Integer, primary_key=True, index=True)
    order_item_id = Column(Integer, ForeignKey("order_item.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("option.id"), nullable=False)
    option_name_snapshot = Column(String(100), nullable=False)  # Snapshot
    price_delta_cents = Column(Integer, nullable=False)  # Snapshot

    # Relationships
    order_item = relationship("OrderItem", back_populates="options")
    option = relationship("Option")

    def __repr__(self):
        return f"<OrderItemOption(id={self.id}, option_name={self.option_name_snapshot})>"


class Payment(Base):
    """
    Payment information.

    Webhook from Mercado Pago is the SINGLE SOURCE OF TRUTH.
    Never trust client-side payment status.

    All amounts in CENTS.
    """
    __tablename__ = "payment"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("order.id"), nullable=False, unique=True)
    mp_preference_id = Column(String(100), nullable=True, index=True)
    mp_payment_id = Column(String(100), nullable=True, unique=True, index=True)
    status = Column(String(50), nullable=False, default="pending")  # MP status
    amount_cents = Column(Integer, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="payment")

    def __repr__(self):
        return f"<Payment(id={self.id}, order_id={self.order_id}, status={self.status})>"


class Favorite(Base):
    """
    User's favorite products.

    Composite primary key (user_id, product_id).
    """
    __tablename__ = "favorite"

    user_id = Column(Integer, ForeignKey("user.id"), primary_key=True)
    product_id = Column(Integer, ForeignKey("product.id"), primary_key=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="favorites")
    product = relationship("Product", back_populates="favorites")

    def __repr__(self):
        return f"<Favorite(user_id={self.user_id}, product_id={self.product_id})>"


# Create indexes for common queries
Index("idx_order_user_status", Order.user_id, Order.status)
Index("idx_order_created_at", Order.created_at.desc())
