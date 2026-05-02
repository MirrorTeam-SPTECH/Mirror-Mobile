import json
import logging

import anthropic

from app.config import settings
from app.domains.nutrition.schemas import NutritionInfo

logger = logging.getLogger(__name__)

_PLACEHOLDER_KEY = "your-claude-key"


def _is_key_configured() -> bool:
    return bool(settings.CLAUDE_API_KEY and settings.CLAUDE_API_KEY != _PLACEHOLDER_KEY)


def generate_nutrition_narrative(nutrition: NutritionInfo, product_name: str) -> str | None:
    if not _is_key_configured():
        return None

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    top_names = ", ".join(i.name for i in nutrition.top_ingredients) if nutrition.top_ingredients else "não informados"

    prompt = (
        f'Você é um nutricionista amigável. Em 2-3 frases curtas e encorajadoras (português brasileiro), '
        f'comente as informações nutricionais do lanche "{product_name}":\n\n'
        f"- Calorias: {nutrition.total_kcal} kcal\n"
        f"- Proteínas: {nutrition.total_protein_g}g\n"
        f"- Carboidratos: {nutrition.total_carb_g}g\n"
        f"- Gorduras: {nutrition.total_fat_g}g\n"
        f"- Sódio: {nutrition.total_sodium_mg}mg\n"
        f"- Ingredientes mais calóricos: {top_names}\n\n"
        f"Seja objetivo e positivo. Mencione o ponto forte nutricional e um lembrete de moderação. "
        f"Não use listas, escreva em parágrafo corrido."
    )

    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def generate_nutrition_ranking_narrative(
    ranked_items: list[dict],
    total_kcal: float,
) -> str:
    if not _is_key_configured():
        return ""

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    items_text = "\n".join(
        f"{i + 1}. {item['product_name']} (x{item['quantity']}): {item['total_kcal']:.0f} kcal"
        for i, item in enumerate(ranked_items)
    )

    prompt = (
        "Você é um nutricionista divertido do Portal do Churras, food truck de hambúrguer artesanal. "
        "O cliente fez um pedido com os seguintes itens ranqueados por calorias:\n\n"
        f"{items_text}\n\n"
        f"Total do pedido: {total_kcal:.0f} kcal\n\n"
        "Em 3-4 frases animadas em português brasileiro, comente o ranking nutricional. "
        "Mencione o item mais calórico, faça uma observação sobre o total, e termine com uma mensagem "
        "positiva sobre aproveitar a refeição. Seja divertido, não assustador. Sem listas."
    )

    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=250,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


def analyze_grill_image(image_base64: str, media_type: str) -> str | None:
    if not _is_key_configured():
        return None

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=300,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Você é um churrasqueiro especialista brasileiro. "
                            "Analise esta foto de carne e responda em português brasileiro:\n\n"
                            "1. Ponto da carne (mal passado, ao ponto, bem passado ou variação)\n"
                            "2. Qualidade visual: aparência, coloração, selagem\n"
                            "3. Uma dica prática para melhorar\n\n"
                            "Seja objetivo e encorajador. Máximo 4 frases, sem listas."
                        ),
                    },
                ],
            }
        ],
    )
    return message.content[0].text


def analyze_competitor_label(
    image_base64: str,
    media_type: str,
    products: list[dict],
) -> tuple[str, list[dict]]:
    if not _is_key_configured():
        return "", []

    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)

    menu_text = "\n".join(
        f"- {p['name']} (R$ {p['base_price_cents'] / 100:.2f})"
        for p in products
    )

    message = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=400,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": (
                            "Você é um consultor nutricional do Portal do Churras, food truck de hambúrguer artesanal.\n\n"
                            "Analise o rótulo nutricional na imagem e:\n"
                            "1. Extraia as informações principais (calorias, proteínas, gorduras, carboidratos, sódio)\n"
                            "2. Sugira o produto mais equivalente do nosso cardápio\n\n"
                            f"Nosso cardápio:\n{menu_text}\n\n"
                            "Responda APENAS com JSON válido neste formato:\n"
                            '{"extracted": "resumo das infos nutricionais em 1-2 frases", '
                            '"suggestion_name": "nome exato do produto do nosso cardápio", '
                            '"reason": "por que é o melhor equivalente em 1 frase"}'
                        ),
                    },
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        result = json.loads(raw)
        extracted = result.get("extracted", "Não foi possível extrair as informações.")
        suggestion_name = result.get("suggestion_name", "").strip()
        reason = result.get("reason", "")

        suggestions = []
        for p in products:
            if p["name"].lower() == suggestion_name.lower():
                suggestions.append({
                    "product_id": p["id"],
                    "name": p["name"],
                    "base_price_cents": p["base_price_cents"],
                    "note": reason,
                })
                break

        return extracted, suggestions
    except (json.JSONDecodeError, KeyError):
        return raw, []
