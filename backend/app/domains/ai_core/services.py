import anthropic

from app.config import settings
from app.domains.nutrition.schemas import NutritionInfo


def generate_nutrition_narrative(nutrition: NutritionInfo, product_name: str) -> str | None:
    if not settings.CLAUDE_API_KEY:
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
