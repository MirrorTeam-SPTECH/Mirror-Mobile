from pydantic import BaseModel

from app.domains.nutrition.schemas import NutritionInfo


class NutritionRankingRequest(BaseModel):
    order_id: int


class RankedItem(BaseModel):
    rank: int
    product_id: int
    product_name: str
    quantity: int
    nutrition_per_unit: NutritionInfo
    total_kcal: float


class NutritionRankingResponse(BaseModel):
    ranking: list[RankedItem]
    narrative: str


class ImageAnalysisRequest(BaseModel):
    image_base64: str
    media_type: str = "image/jpeg"


class GrillAdvisorResponse(BaseModel):
    analysis: str


class ProductSuggestion(BaseModel):
    product_id: int
    name: str
    base_price_cents: int
    note: str


class LabelScannerResponse(BaseModel):
    extracted_info: str
    suggestions: list[ProductSuggestion]
