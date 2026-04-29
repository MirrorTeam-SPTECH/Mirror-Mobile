from sqlalchemy.orm import Session

from app.domains.nutrition.models import Ingredient, ProductIngredient
from app.domains.nutrition.schemas import NutritionInfo, TopIngredient


def calculate_product_nutrition(db: Session, product_id: int) -> NutritionInfo | None:
    rows = (
        db.query(ProductIngredient, Ingredient)
        .join(Ingredient, ProductIngredient.ingredient_id == Ingredient.id)
        .filter(ProductIngredient.product_id == product_id)
        .all()
    )

    if not rows:
        return None

    total_kcal = 0.0
    total_protein_g = 0.0
    total_carb_g = 0.0
    total_fat_g = 0.0
    total_sodium_mg = 0.0
    ingredient_kcals: list[TopIngredient] = []

    for pi, ing in rows:
        factor = pi.default_grams / 100.0
        kcal = ing.kcal_per_100g * factor
        total_kcal += kcal
        total_protein_g += ing.protein_g * factor
        total_carb_g += ing.carb_g * factor
        total_fat_g += ing.fat_g * factor
        total_sodium_mg += ing.sodium_mg * factor
        ingredient_kcals.append(TopIngredient(name=ing.name, kcal=round(kcal, 1)))

    top = sorted(ingredient_kcals, key=lambda x: x.kcal, reverse=True)[:3]

    return NutritionInfo(
        total_kcal=round(total_kcal, 1),
        total_protein_g=round(total_protein_g, 1),
        total_carb_g=round(total_carb_g, 1),
        total_fat_g=round(total_fat_g, 1),
        total_sodium_mg=round(total_sodium_mg, 1),
        top_ingredients=top,
    )
