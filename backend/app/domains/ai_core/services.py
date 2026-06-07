import base64
import io
import json
import logging

import anthropic

from app.config import settings
from app.domains.nutrition.schemas import NutritionInfo

logger = logging.getLogger(__name__)

_PLACEHOLDERS = {"", "your-claude-key", "your-gemini-key"}

# Max dimension (px) sent to vision APIs — shrinks large camera photos before upload
_MAX_IMAGE_PX = 1024


def _claude_ok() -> bool:
    return bool(settings.CLAUDE_API_KEY and settings.CLAUDE_API_KEY not in _PLACEHOLDERS)


def _gemini_ok() -> bool:
    return bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY not in _PLACEHOLDERS)


# Keep legacy helper name used in nutrition routes
def _is_key_configured() -> bool:
    return _claude_ok()


# ─── Mock responses ───────────────────────────────────────────────────────────

_GRILL_MOCK = (
    "Sua carne está ao ponto — a coloração dourada nas bordas com interior ainda suculento "
    "indica uma temperatura de grelha bem controlada. A selagem está ótima, mantendo os "
    "sucos preservados dentro da peça. "
    "Dica de mestre: deixe descansar 2 minutinhos antes de cortar para cada fatia ficar perfeita!"
)

_LABEL_MOCK_EXTRACTED = (
    "Produto com aproximadamente 480 kcal, 26 g de proteínas, 38 g de carboidratos e 24 g de gorduras "
    "— perfil nutricional típico de um hambúrguer tradicional de rede fast-food."
)
_LABEL_MOCK_SUGGESTION = "X-Salada"
_LABEL_MOCK_REASON = (
    "Perfil calórico similar com ingredientes mais frescos e pão artesanal do Portal do Churras."
)


# ─── Image resize helper ─────────────────────────────────────────────────────

def _resize_image(image_base64: str, max_px: int = _MAX_IMAGE_PX) -> tuple[str, str]:
    """Resize image so its longest side ≤ max_px. Returns (base64, media_type)."""
    from PIL import Image as PilImage

    image_bytes = base64.b64decode(image_base64)
    img = PilImage.open(io.BytesIO(image_bytes))

    if max(img.width, img.height) > max_px:
        img.thumbnail((max_px, max_px), PilImage.LANCZOS)

    buf = io.BytesIO()
    fmt = img.format or "JPEG"
    if fmt not in ("JPEG", "PNG", "WEBP", "GIF"):
        fmt = "JPEG"
    img.save(buf, format=fmt)
    resized_b64 = base64.b64encode(buf.getvalue()).decode()
    media_type = f"image/{fmt.lower()}"
    return resized_b64, media_type


# ─── Gemini image analysis ────────────────────────────────────────────────────

_gemini_model_cache: dict = {}


def _get_gemini_model():
    import google.generativeai as genai

    key = settings.GEMINI_API_KEY
    if key not in _gemini_model_cache:
        genai.configure(api_key=key)
        _gemini_model_cache[key] = genai.GenerativeModel(settings.GEMINI_MODEL)
    return _gemini_model_cache[key]


def _gemini_analyze_image(prompt: str, image_base64: str, media_type: str) -> str:
    from PIL import Image as PilImage

    model = _get_gemini_model()
    image_bytes = base64.b64decode(image_base64)
    img = PilImage.open(io.BytesIO(image_bytes))

    response = model.generate_content([prompt, img])
    return response.text.strip()


# ─── Claude image analysis ────────────────────────────────────────────────────

def _claude_analyze_image(prompt: str, image_base64: str, media_type: str) -> str:
    client = anthropic.Anthropic(api_key=settings.CLAUDE_API_KEY)
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
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )
    return message.content[0].text.strip()


def _analyze_image(prompt: str, image_base64: str, media_type: str) -> str | None:
    """Resize image, then try Gemini → Claude → None (caller uses mock)."""
    try:
        image_base64, media_type = _resize_image(image_base64)
    except Exception as e:
        logger.warning("Image resize failed, sending original", extra={"error": str(e)})

    if _gemini_ok():
        try:
            return _gemini_analyze_image(prompt, image_base64, media_type)
        except Exception as e:
            logger.warning("Gemini image analysis failed, trying Claude", extra={"error": str(e)})

    if _claude_ok():
        try:
            return _claude_analyze_image(prompt, image_base64, media_type)
        except Exception as e:
            logger.warning("Claude image analysis failed", extra={"error": str(e)})

    return None


# ─── Public API ───────────────────────────────────────────────────────────────

def generate_nutrition_narrative(nutrition: NutritionInfo, product_name: str) -> str | None:
    if not _claude_ok():
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
    if not _claude_ok():
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


def analyze_grill_image(image_base64: str, media_type: str) -> str:
    prompt = (
        "Você é um churrasqueiro especialista brasileiro.\n\n"
        "PRIMEIRO: verifique se a imagem mostra carne (bife, hambúrguer, frango, linguiça, costela etc.) "
        "sendo preparada, grelhada ou já pronta para comer.\n"
        "- Se NÃO mostrar carne, responda APENAS: "
        "\"Não identifiquei carne nesta imagem. Envie uma foto da sua carne na grelha ou frigideira!\"\n"
        "- Se mostrar carne, responda em português brasileiro com no máximo 4 frases corridas (sem listas):\n"
        "  o ponto da carne (mal passado, ao ponto, bem passado), "
        "  a qualidade visual (coloração, selagem, aparência) e "
        "  uma dica prática para melhorar. Seja objetivo e encorajador."
    )
    result = _analyze_image(prompt, image_base64, media_type)
    return result if result is not None else _GRILL_MOCK


def analyze_competitor_label(
    image_base64: str,
    media_type: str,
    products: list[dict],
) -> tuple[str, list[dict]]:
    menu_text = "\n".join(
        f"- {p['name']} (R$ {p['base_price_cents'] / 100:.2f})"
        for p in products
    )

    prompt = (
        "Você é um consultor nutricional do Portal do Churras, food truck de hambúrguer artesanal.\n\n"
        "PRIMEIRO: verifique se a imagem mostra um rótulo nutricional ou embalagem de alimento com "
        "informações nutricionais legíveis.\n"
        "- Se NÃO mostrar um rótulo nutricional, responda APENAS com este JSON:\n"
        '{"error": "Não identifiquei um rótulo nutricional nesta imagem. '
        'Envie uma foto da tabela nutricional da embalagem do produto concorrente."}\n'
        "- Se mostrar um rótulo, extraia as informações e responda APENAS com JSON válido:\n"
        '{"extracted": "resumo das infos nutricionais em 1-2 frases (calorias, proteínas, gorduras, carboidratos, sódio)", '
        '"suggestion_name": "nome exato do produto do nosso cardápio mais equivalente", '
        '"reason": "por que é o melhor equivalente em 1 frase"}\n\n'
        f"Nosso cardápio:\n{menu_text}"
    )

    raw = _analyze_image(prompt, image_base64, media_type)

    if raw is None:
        # Mock: suggest the first active product that matches "X-Salada" or fallback to first
        suggestion = next((p for p in products if "salada" in p["name"].lower()), products[0] if products else None)
        if suggestion:
            return _LABEL_MOCK_EXTRACTED, [{
                "product_id": suggestion["id"],
                "name": suggestion["name"],
                "base_price_cents": suggestion["base_price_cents"],
                "note": _LABEL_MOCK_REASON,
            }]
        return _LABEL_MOCK_EXTRACTED, []

    # Parse JSON from AI response
    clean = raw
    if clean.startswith("```"):
        clean = clean.split("```")[1]
        if clean.startswith("json"):
            clean = clean[4:]
        clean = clean.strip()

    try:
        result = json.loads(clean)

        if "error" in result:
            return result["error"], []

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
