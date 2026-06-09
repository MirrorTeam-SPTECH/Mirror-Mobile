from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional




# ============================================================================
# Category Schemas
# ============================================================================

class CategoryResponse(BaseModel):
    id: int
    name: str
    sort_order: int

    class Config:
        from_attributes = True


# ============================================================================
# Option Schemas
# ============================================================================

class OptionResponse(BaseModel):
    id: int
    option_group_id: int
    name: str
    price_delta_cents: int
    is_active: bool
    sort_order: int

    class Config:
        from_attributes = True


class OptionGroupResponse(BaseModel):
    id: int
    product_id: int
    name: str
    min_select: int
    max_select: int
    is_required: bool
    sort_order: int
    options: list[OptionResponse] = []

    class Config:
        from_attributes = True


# ============================================================================
# Product Schemas
# ============================================================================

class ProductListResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str]
    base_price_cents: int
    image_url: Optional[str]
    prep_minutes: int
    is_active: bool

    class Config:
        from_attributes = True


class ProductDetailResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str]
    base_price_cents: int
    image_url: Optional[str]
    prep_minutes: int
    is_active: bool
    option_groups: list[OptionGroupResponse] = []

    class Config:
        from_attributes = True


# ============================================================================
# Order Create Schemas (input)
# ============================================================================

class OrderItemOptionCreate(BaseModel):
    option_id: int


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)
    options: list[OrderItemOptionCreate] = []


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    notes: Optional[str] = None


# ============================================================================
# Order Response Schemas (output)
# ============================================================================

class OrderItemOptionResponse(BaseModel):
    id: int
    option_id: int
    option_name_snapshot: str
    price_delta_cents: int

    class Config:
        from_attributes = True


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    name_snapshot: str
    quantity: int
    unit_price_cents: int
    options: list[OrderItemOptionResponse] = []

    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    status: str
    mp_preference_id: Optional[str] = None
    amount_cents: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str
    pickup_code: Optional[str] = None
    subtotal_cents: int
    total_cents: int
    notes: Optional[str] = None
    created_at: datetime
    items: list[OrderItemResponse] = []
    payment: Optional[PaymentResponse] = None

    class Config:
        from_attributes = True


class OrderItemSummary(BaseModel):
    product_id: int
    name_snapshot: str
    quantity: int

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    id: int
    status: str
    pickup_code: Optional[str] = None
    total_cents: int
    created_at: datetime
    items: list[OrderItemSummary] = []

    class Config:
        from_attributes = True


class TopProductResponse(BaseModel):
    product_id: int
    name: str
    total_quantity: int

    class Config:
        from_attributes = True


class PayPreferenceResponse(BaseModel):
    init_point: Optional[str] = None
    sandbox_init_point: Optional[str] = None
    preference_id: str


# ============================================================================
# Loyalty Schemas
# ============================================================================

class LoyaltyStampItem(BaseModel):
    order_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LoyaltyResponse(BaseModel):
    total_stamps: int
    stamps_in_cycle: int
    cycles_completed: int
    recent_stamps: list[LoyaltyStampItem] = []


# ============================================================================
# Rating Schemas
# ============================================================================

class RatingCreate(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: Optional[str] = None
    image_base64: Optional[str] = None


class RatingResponse(BaseModel):
    id: int
    order_id: int
    stars: int
    comment: Optional[str] = None
    has_image: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# ETA Schema
# ============================================================================

class ETAResponse(BaseModel):
    estimated_minutes: Optional[int] = None
