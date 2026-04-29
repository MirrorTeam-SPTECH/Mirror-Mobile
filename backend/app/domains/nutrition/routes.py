from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.domains.nutrition.schemas import NarrativeRequest, NarrativeResponse, NutritionInfo
from app.domains.nutrition.services import calculate_product_nutrition
from app.domains.ai_core.services import generate_nutrition_narrative

router = APIRouter()


@router.get("/products/{product_id}", response_model=NutritionInfo)
def get_product_nutrition(product_id: int, db: Session = Depends(get_db)):
    nutrition = calculate_product_nutrition(db, product_id)
    if nutrition is None:
        raise HTTPException(status_code=404, detail="Dados nutricionais não disponíveis para este produto")
    return nutrition


@router.post("/narrative", response_model=NarrativeResponse)
def get_nutrition_narrative(body: NarrativeRequest):
    narrative = generate_nutrition_narrative(body.nutrition, body.product_name)
    if narrative is None:
        raise HTTPException(status_code=503, detail="Serviço de IA não configurado")
    return NarrativeResponse(narrative=narrative)
