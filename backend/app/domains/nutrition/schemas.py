from pydantic import BaseModel


class IngredientResponse(BaseModel):
    id: int
    name: str
    category: str
    kcal_per_100g: float
    protein_g: float
    carb_g: float
    fat_g: float
    sodium_mg: float

    class Config:
        from_attributes = True


class TopIngredient(BaseModel):
    name: str
    kcal: float


class NutritionInfo(BaseModel):
    total_kcal: float
    total_protein_g: float
    total_carb_g: float
    total_fat_g: float
    total_sodium_mg: float
    top_ingredients: list[TopIngredient]


class NarrativeRequest(BaseModel):
    product_id: int
    product_name: str
    nutrition: NutritionInfo


class NarrativeResponse(BaseModel):
    narrative: str
