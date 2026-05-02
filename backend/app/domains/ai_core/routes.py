from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.domains.ai_core.schemas import (
    GrillAdvisorResponse,
    ImageAnalysisRequest,
    LabelScannerResponse,
    NutritionRankingRequest,
    NutritionRankingResponse,
    ProductSuggestion,
    RankedItem,
)
from app.domains.ai_core.services import (
    analyze_competitor_label,
    analyze_grill_image,
    generate_nutrition_ranking_narrative,
)
from app.domains.nutrition.services import calculate_product_nutrition
from app.domains.orders.models import Order, Product
from app.domains.users.models import User

router = APIRouter()


@router.post("/nutrition-ranking", response_model=NutritionRankingResponse)
def generate_nutrition_ranking(
    body: NutritionRankingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .filter(Order.id == body.order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")

    ranked: list[RankedItem] = []
    for item in order.items:
        nutrition = calculate_product_nutrition(db, item.product_id)
        if nutrition is None:
            continue
        total_kcal = round(nutrition.total_kcal * item.quantity, 1)
        ranked.append(
            RankedItem(
                rank=0,
                product_id=item.product_id,
                product_name=item.name_snapshot,
                quantity=item.quantity,
                nutrition_per_unit=nutrition,
                total_kcal=total_kcal,
            )
        )

    if not ranked:
        raise HTTPException(
            status_code=422,
            detail="Nenhum dado nutricional disponível para os itens deste pedido",
        )

    ranked.sort(key=lambda x: x.total_kcal, reverse=True)
    for i, item in enumerate(ranked):
        item.rank = i + 1

    total_kcal = sum(r.total_kcal for r in ranked)
    narrative = generate_nutrition_ranking_narrative(
        [
            {"product_name": r.product_name, "quantity": r.quantity, "total_kcal": r.total_kcal}
            for r in ranked
        ],
        total_kcal,
    )

    return NutritionRankingResponse(ranking=ranked, narrative=narrative)


@router.post("/grill-advisor", response_model=GrillAdvisorResponse)
def grill_advisor(body: ImageAnalysisRequest):
    analysis = analyze_grill_image(body.image_base64, body.media_type)
    if analysis is None:
        raise HTTPException(status_code=503, detail="Serviço de IA não configurado")
    return GrillAdvisorResponse(analysis=analysis)


@router.post("/label-scanner", response_model=LabelScannerResponse)
def label_scanner(
    body: ImageAnalysisRequest,
    db: Session = Depends(get_db),
):
    products = db.query(Product).filter(Product.is_active == True).all()
    products_data = [
        {"id": p.id, "name": p.name, "base_price_cents": p.base_price_cents}
        for p in products
    ]

    extracted_info, suggestions_data = analyze_competitor_label(
        body.image_base64,
        body.media_type,
        products_data,
    )

    if not extracted_info:
        raise HTTPException(status_code=503, detail="Serviço de IA não configurado")

    return LabelScannerResponse(
        extracted_info=extracted_info,
        suggestions=[ProductSuggestion(**s) for s in suggestions_data],
    )
