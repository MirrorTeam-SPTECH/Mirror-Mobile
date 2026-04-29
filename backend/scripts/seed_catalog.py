"""
Seed script to populate initial catalog.

Populates:
- Categories
- Products
- OptionGroups
- Options

Run with:
    python -m scripts.seed_catalog
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base

# Import all models so Base.metadata.create_all creates every table
import app.domains.orders.models  # noqa: F401
import app.domains.users.models  # noqa: F401
import app.domains.nutrition.models  # noqa: F401

from app.domains.orders.models import Category, Product, OptionGroup, Option
from app.domains.nutrition.models import Ingredient, ProductIngredient


def create_categories(db: Session):
    """Create product categories"""
    categories = [
        Category(id=1, name="Hambúrgueres", sort_order=1),
        Category(id=2, name="Bebidas", sort_order=2),
        Category(id=3, name="Acompanhamentos", sort_order=3),
        Category(id=4, name="Sobremesas", sort_order=4),
        Category(id=5, name="Combos", sort_order=5),
    ]

    for category in categories:
        existing = db.query(Category).filter(Category.name == category.name).first()
        if not existing:
            db.add(category)
            print(f"✓ Created category: {category.name}")
        else:
            print(f"⊘ Category already exists: {category.name}")

    db.commit()
    print()


def create_products(db: Session):
    """Create products (lanches)"""
    products = [
        # Hambúrgueres
        Product(
            id=1,
            category_id=1,
            name="X-Salada",
            description="Hambúrguer artesanal, queijo, alface, tomate, cebola e molho especial",
            base_price_cents=2900,  # R$ 29,00
            prep_minutes=15,
            is_active=True
        ),
        Product(
            id=2,
            category_id=1,
            name="X-Bacon",
            description="Hambúrguer artesanal, queijo, bacon crocante, alface, tomate e molho barbecue",
            base_price_cents=3400,  # R$ 34,00
            prep_minutes=18,
            is_active=True
        ),
        Product(
            id=3,
            category_id=1,
            name="X-Gordão",
            description="Duplo hambúrguer artesanal, queijo cheddar, bacon, ovo, alface, tomate e maionese da casa",
            base_price_cents=4200,  # R$ 42,00
            prep_minutes=20,
            is_active=True
        ),
        Product(
            id=4,
            category_id=1,
            name="X-Frango",
            description="Filé de frango grelhado, queijo, alface, tomate e molho especial",
            base_price_cents=3200,  # R$ 32,00
            prep_minutes=18,
            is_active=True
        ),
        Product(
            id=5,
            category_id=1,
            name="X-Vegetariano",
            description="Hambúrguer vegetal, queijo, alface, tomate, cebola roxa e molho de ervas",
            base_price_cents=3100,  # R$ 31,00
            prep_minutes=15,
            is_active=True
        ),

        # Bebidas
        Product(
            id=6,
            category_id=2,
            name="Refrigerante Lata",
            description="Coca-Cola, Guaraná ou Fanta (350ml)",
            base_price_cents=500,  # R$ 5,00
            prep_minutes=1,
            is_active=True
        ),
        Product(
            id=7,
            category_id=2,
            name="Suco Natural",
            description="Suco natural de laranja, limão ou abacaxi (500ml)",
            base_price_cents=800,  # R$ 8,00
            prep_minutes=5,
            is_active=True
        ),
        Product(
            id=8,
            category_id=2,
            name="Água Mineral",
            description="Água mineral (500ml)",
            base_price_cents=300,  # R$ 3,00
            prep_minutes=1,
            is_active=True
        ),

        # Acompanhamentos
        Product(
            id=9,
            category_id=3,
            name="Batata Frita",
            description="Batata frita crocante (porção média)",
            base_price_cents=1200,  # R$ 12,00
            prep_minutes=10,
            is_active=True
        ),
        Product(
            id=10,
            category_id=3,
            name="Onion Rings",
            description="Anéis de cebola empanados (porção)",
            base_price_cents=1500,  # R$ 15,00
            prep_minutes=12,
            is_active=True
        ),

        # Sobremesas
        Product(
            id=11,
            category_id=4,
            name="Brownie com Sorvete",
            description="Brownie de chocolate com sorvete de baunilha",
            base_price_cents=1800,  # R$ 18,00
            prep_minutes=5,
            is_active=True
        ),

        # Combos
        Product(
            id=12,
            category_id=5,
            name="Combo X-Salada",
            description="X-Salada + Batata Frita + Refrigerante",
            base_price_cents=4000,  # R$ 40,00 (economia de R$ 1,60)
            prep_minutes=15,
            is_active=True
        ),
        Product(
            id=13,
            category_id=5,
            name="Combo X-Bacon",
            description="X-Bacon + Batata Frita + Refrigerante",
            base_price_cents=4500,  # R$ 45,00
            prep_minutes=18,
            is_active=True
        ),
    ]

    for product in products:
        existing = db.query(Product).filter(Product.id == product.id).first()
        if not existing:
            db.add(product)
            print(f"✓ Created product: {product.name} - R$ {product.base_price_cents/100:.2f}")
        else:
            print(f"⊘ Product already exists: {product.name}")

    db.commit()
    print()


def create_option_groups_and_options(db: Session):
    """Create customization option groups and options"""

    # Option Groups
    option_groups = [
        # Para hambúrgueres (produtos 1-5)
        OptionGroup(id=1, product_id=1, name="Tipo de Queijo", min_select=1, max_select=1, is_required=True, sort_order=1),
        OptionGroup(id=2, product_id=1, name="Ponto da Carne", min_select=1, max_select=1, is_required=True, sort_order=2),
        OptionGroup(id=3, product_id=1, name="Extras", min_select=0, max_select=5, is_required=False, sort_order=3),

        OptionGroup(id=4, product_id=2, name="Tipo de Queijo", min_select=1, max_select=1, is_required=True, sort_order=1),
        OptionGroup(id=5, product_id=2, name="Ponto da Carne", min_select=1, max_select=1, is_required=True, sort_order=2),
        OptionGroup(id=6, product_id=2, name="Extras", min_select=0, max_select=5, is_required=False, sort_order=3),

        OptionGroup(id=7, product_id=3, name="Tipo de Queijo", min_select=1, max_select=1, is_required=True, sort_order=1),
        OptionGroup(id=8, product_id=3, name="Ponto da Carne", min_select=1, max_select=1, is_required=True, sort_order=2),
        OptionGroup(id=9, product_id=3, name="Extras", min_select=0, max_select=5, is_required=False, sort_order=3),

        OptionGroup(id=10, product_id=4, name="Tipo de Queijo", min_select=1, max_select=1, is_required=True, sort_order=1),
        OptionGroup(id=11, product_id=4, name="Extras", min_select=0, max_select=5, is_required=False, sort_order=2),

        OptionGroup(id=12, product_id=5, name="Tipo de Queijo", min_select=1, max_select=1, is_required=True, sort_order=1),
        OptionGroup(id=13, product_id=5, name="Extras", min_select=0, max_select=5, is_required=False, sort_order=2),

        # Para bebidas
        OptionGroup(id=14, product_id=6, name="Sabor", min_select=1, max_select=1, is_required=True, sort_order=1),
        OptionGroup(id=15, product_id=7, name="Sabor", min_select=1, max_select=1, is_required=True, sort_order=1),

        # Para batata frita
        OptionGroup(id=16, product_id=9, name="Tamanho", min_select=1, max_select=1, is_required=True, sort_order=1),
        OptionGroup(id=17, product_id=9, name="Molhos", min_select=0, max_select=3, is_required=False, sort_order=2),
    ]

    for og in option_groups:
        existing = db.query(OptionGroup).filter(OptionGroup.id == og.id).first()
        if not existing:
            db.add(og)

    db.commit()
    print("✓ Created option groups")

    # Options
    options = [
        # Tipo de Queijo (option_group_id 1, 4, 7, 10, 12)
        Option(id=1, option_group_id=1, name="Queijo Prato", price_delta_cents=0, sort_order=1),
        Option(id=2, option_group_id=1, name="Queijo Cheddar", price_delta_cents=200, sort_order=2),  # +R$ 2,00
        Option(id=3, option_group_id=1, name="Queijo Suíço", price_delta_cents=300, sort_order=3),

        Option(id=4, option_group_id=4, name="Queijo Prato", price_delta_cents=0, sort_order=1),
        Option(id=5, option_group_id=4, name="Queijo Cheddar", price_delta_cents=200, sort_order=2),
        Option(id=6, option_group_id=4, name="Queijo Suíço", price_delta_cents=300, sort_order=3),

        Option(id=7, option_group_id=7, name="Queijo Prato", price_delta_cents=0, sort_order=1),
        Option(id=8, option_group_id=7, name="Queijo Cheddar", price_delta_cents=200, sort_order=2),
        Option(id=9, option_group_id=7, name="Queijo Suíço", price_delta_cents=300, sort_order=3),

        Option(id=10, option_group_id=10, name="Queijo Prato", price_delta_cents=0, sort_order=1),
        Option(id=11, option_group_id=10, name="Queijo Cheddar", price_delta_cents=200, sort_order=2),
        Option(id=12, option_group_id=10, name="Queijo Suíço", price_delta_cents=300, sort_order=3),

        Option(id=13, option_group_id=12, name="Queijo Prato", price_delta_cents=0, sort_order=1),
        Option(id=14, option_group_id=12, name="Queijo Cheddar", price_delta_cents=200, sort_order=2),
        Option(id=15, option_group_id=12, name="Queijo Suíço", price_delta_cents=300, sort_order=3),

        # Ponto da Carne (option_group_id 2, 5, 8)
        Option(id=16, option_group_id=2, name="Mal Passado", price_delta_cents=0, sort_order=1),
        Option(id=17, option_group_id=2, name="Ao Ponto", price_delta_cents=0, sort_order=2),
        Option(id=18, option_group_id=2, name="Bem Passado", price_delta_cents=0, sort_order=3),

        Option(id=19, option_group_id=5, name="Mal Passado", price_delta_cents=0, sort_order=1),
        Option(id=20, option_group_id=5, name="Ao Ponto", price_delta_cents=0, sort_order=2),
        Option(id=21, option_group_id=5, name="Bem Passado", price_delta_cents=0, sort_order=3),

        Option(id=22, option_group_id=8, name="Mal Passado", price_delta_cents=0, sort_order=1),
        Option(id=23, option_group_id=8, name="Ao Ponto", price_delta_cents=0, sort_order=2),
        Option(id=24, option_group_id=8, name="Bem Passado", price_delta_cents=0, sort_order=3),

        # Extras (option_group_id 3, 6, 9, 11, 13)
        Option(id=25, option_group_id=3, name="Bacon Extra", price_delta_cents=500, sort_order=1),
        Option(id=26, option_group_id=3, name="Ovo", price_delta_cents=300, sort_order=2),
        Option(id=27, option_group_id=3, name="Cebola Caramelizada", price_delta_cents=200, sort_order=3),
        Option(id=28, option_group_id=3, name="Picles", price_delta_cents=100, sort_order=4),
        Option(id=29, option_group_id=3, name="Hambúrguer Extra", price_delta_cents=800, sort_order=5),

        Option(id=30, option_group_id=6, name="Bacon Extra", price_delta_cents=500, sort_order=1),
        Option(id=31, option_group_id=6, name="Ovo", price_delta_cents=300, sort_order=2),
        Option(id=32, option_group_id=6, name="Cebola Caramelizada", price_delta_cents=200, sort_order=3),
        Option(id=33, option_group_id=6, name="Picles", price_delta_cents=100, sort_order=4),
        Option(id=34, option_group_id=6, name="Hambúrguer Extra", price_delta_cents=800, sort_order=5),

        Option(id=35, option_group_id=9, name="Bacon Extra", price_delta_cents=500, sort_order=1),
        Option(id=36, option_group_id=9, name="Ovo Extra", price_delta_cents=300, sort_order=2),
        Option(id=37, option_group_id=9, name="Cebola Caramelizada", price_delta_cents=200, sort_order=3),
        Option(id=38, option_group_id=9, name="Picles", price_delta_cents=100, sort_order=4),
        Option(id=39, option_group_id=9, name="Hambúrguer Extra", price_delta_cents=800, sort_order=5),

        Option(id=40, option_group_id=11, name="Bacon", price_delta_cents=500, sort_order=1),
        Option(id=41, option_group_id=11, name="Cebola Caramelizada", price_delta_cents=200, sort_order=2),
        Option(id=42, option_group_id=11, name="Picles", price_delta_cents=100, sort_order=3),

        Option(id=43, option_group_id=13, name="Cebola Caramelizada", price_delta_cents=200, sort_order=1),
        Option(id=44, option_group_id=13, name="Picles", price_delta_cents=100, sort_order=2),

        # Sabor Refrigerante (option_group_id 14)
        Option(id=45, option_group_id=14, name="Coca-Cola", price_delta_cents=0, sort_order=1),
        Option(id=46, option_group_id=14, name="Guaraná", price_delta_cents=0, sort_order=2),
        Option(id=47, option_group_id=14, name="Fanta Laranja", price_delta_cents=0, sort_order=3),

        # Sabor Suco (option_group_id 15)
        Option(id=48, option_group_id=15, name="Laranja", price_delta_cents=0, sort_order=1),
        Option(id=49, option_group_id=15, name="Limão", price_delta_cents=0, sort_order=2),
        Option(id=50, option_group_id=15, name="Abacaxi", price_delta_cents=0, sort_order=3),

        # Tamanho Batata (option_group_id 16)
        Option(id=51, option_group_id=16, name="Média", price_delta_cents=0, sort_order=1),
        Option(id=52, option_group_id=16, name="Grande", price_delta_cents=500, sort_order=2),  # +R$ 5,00

        # Molhos Batata (option_group_id 17)
        Option(id=53, option_group_id=17, name="Ketchup", price_delta_cents=0, sort_order=1),
        Option(id=54, option_group_id=17, name="Mostarda", price_delta_cents=0, sort_order=2),
        Option(id=55, option_group_id=17, name="Maionese", price_delta_cents=0, sort_order=3),
        Option(id=56, option_group_id=17, name="Barbecue", price_delta_cents=100, sort_order=4),
    ]

    for option in options:
        existing = db.query(Option).filter(Option.id == option.id).first()
        if not existing:
            db.add(option)

    db.commit()
    print(f"✓ Created {len(options)} options")
    print()


def create_ingredients_and_nutrition(db: Session):
    """Create ingredients (TACO/USDA values per 100g) and link to products."""

    # --- Ingredients ---
    # All nutritional values are per 100g (TACO table approximations)
    ingredients = [
        Ingredient(id=1,  name="Pão de hambúrguer",      category="pães",         kcal_per_100g=280, protein_g=8.0,  carb_g=50.0, fat_g=5.0,  sodium_mg=480),
        Ingredient(id=2,  name="Hambúrguer bovino",       category="carnes",       kcal_per_100g=243, protein_g=17.0, carb_g=0.0,  fat_g=19.0, sodium_mg=65),
        Ingredient(id=3,  name="Queijo prato",            category="queijos",      kcal_per_100g=358, protein_g=22.0, carb_g=1.5,  fat_g=29.0, sodium_mg=660),
        Ingredient(id=4,  name="Queijo cheddar",          category="queijos",      kcal_per_100g=402, protein_g=25.0, carb_g=1.3,  fat_g=33.0, sodium_mg=620),
        Ingredient(id=5,  name="Alface",                  category="vegetais",     kcal_per_100g=15,  protein_g=1.4,  carb_g=2.2,  fat_g=0.2,  sodium_mg=10),
        Ingredient(id=6,  name="Tomate",                  category="vegetais",     kcal_per_100g=18,  protein_g=0.9,  carb_g=3.9,  fat_g=0.2,  sodium_mg=5),
        Ingredient(id=7,  name="Cebola",                  category="vegetais",     kcal_per_100g=38,  protein_g=0.9,  carb_g=8.9,  fat_g=0.1,  sodium_mg=4),
        Ingredient(id=8,  name="Bacon",                   category="carnes",       kcal_per_100g=541, protein_g=37.0, carb_g=1.5,  fat_g=42.0, sodium_mg=1717),
        Ingredient(id=9,  name="Ovo de galinha",          category="ovos",         kcal_per_100g=143, protein_g=13.0, carb_g=1.1,  fat_g=9.5,  sodium_mg=142),
        Ingredient(id=10, name="Maionese",                category="molhos",       kcal_per_100g=680, protein_g=1.2,  carb_g=2.6,  fat_g=75.0, sodium_mg=480),
        Ingredient(id=11, name="Molho barbecue",          category="molhos",       kcal_per_100g=143, protein_g=1.2,  carb_g=37.0, fat_g=0.3,  sodium_mg=620),
        Ingredient(id=12, name="Frango grelhado",         category="carnes",       kcal_per_100g=163, protein_g=31.0, carb_g=0.0,  fat_g=3.6,  sodium_mg=74),
        Ingredient(id=13, name="Hambúrguer vegetal",      category="vegetais",     kcal_per_100g=168, protein_g=14.0, carb_g=12.0, fat_g=6.0,  sodium_mg=370),
        Ingredient(id=14, name="Batata frita",            category="acompanham.",  kcal_per_100g=312, protein_g=3.4,  carb_g=41.0, fat_g=15.0, sodium_mg=210),
        Ingredient(id=15, name="Cebola empanada",         category="acompanham.",  kcal_per_100g=276, protein_g=3.7,  carb_g=31.0, fat_g=16.0, sodium_mg=330),
    ]

    for ing in ingredients:
        existing = db.query(Ingredient).filter(Ingredient.id == ing.id).first()
        if not existing:
            db.add(ing)
            print(f"✓ Created ingredient: {ing.name}")
        else:
            print(f"⊘ Ingredient already exists: {ing.name}")

    db.commit()
    print()

    # --- Product ↔ Ingredient links (base recipe, before any customization) ---
    # (product_id, ingredient_id, default_grams)
    links = [
        # X-Salada (id=1): pão, carne, queijo prato, alface, tomate, cebola, maionese
        (1,  1,  80),   # Pão de hambúrguer
        (1,  2, 120),   # Hambúrguer bovino
        (1,  3,  25),   # Queijo prato
        (1,  5,  20),   # Alface
        (1,  6,  30),   # Tomate
        (1,  7,  20),   # Cebola
        (1, 10,  15),   # Maionese

        # X-Bacon (id=2): pão, carne, queijo prato, bacon, alface, tomate, barbecue
        (2,  1,  80),
        (2,  2, 120),
        (2,  3,  25),
        (2,  8,  40),   # Bacon
        (2,  5,  15),
        (2,  6,  25),
        (2, 11,  20),   # Molho barbecue

        # X-Gordão (id=3): pão maior, dupla carne, cheddar, bacon, ovo, alface, tomate, maionese
        (3,  1,  90),
        (3,  2, 240),   # Duplo hambúrguer
        (3,  4,  35),   # Queijo cheddar
        (3,  8,  40),
        (3,  9,  50),   # Ovo
        (3,  5,  20),
        (3,  6,  25),
        (3, 10,  20),

        # X-Frango (id=4): pão, frango, queijo prato, alface, tomate, maionese
        (4,  1,  80),
        (4, 12, 130),   # Frango grelhado
        (4,  3,  25),
        (4,  5,  20),
        (4,  6,  30),
        (4, 10,  15),

        # X-Vegetariano (id=5): pão, vegetal, queijo prato, alface, tomate, cebola
        (5,  1,  80),
        (5, 13, 100),   # Hambúrguer vegetal
        (5,  3,  25),
        (5,  5,  25),
        (5,  6,  30),
        (5,  7,  20),

        # Batata Frita (id=9): batata frita porção média
        (9, 14, 200),

        # Onion Rings (id=10): cebola empanada
        (10, 15, 180),
    ]

    added = 0
    for product_id, ingredient_id, grams in links:
        existing = db.query(ProductIngredient).filter(
            ProductIngredient.product_id == product_id,
            ProductIngredient.ingredient_id == ingredient_id,
        ).first()
        if not existing:
            db.add(ProductIngredient(product_id=product_id, ingredient_id=ingredient_id, default_grams=grams))
            added += 1

    db.commit()
    print(f"✓ Created {added} product-ingredient links")
    print()


def seed_catalog():
    """Main seed function"""
    print("=" * 60)
    print("SEEDING CATALOG - Portal do Churras")
    print("=" * 60)
    print()

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        create_categories(db)
        create_products(db)
        create_option_groups_and_options(db)
        create_ingredients_and_nutrition(db)

        print("=" * 60)
        print("✓ CATALOG SEEDED SUCCESSFULLY!")
        print("=" * 60)
        print()
        print(f"Categories: {db.query(Category).count()}")
        print(f"Products: {db.query(Product).count()}")
        print(f"Option Groups: {db.query(OptionGroup).count()}")
        print(f"Options: {db.query(Option).count()}")
        print(f"Ingredients: {db.query(Ingredient).count()}")
        print(f"Product-Ingredient links: {db.query(ProductIngredient).count()}")
        print()

    except Exception as e:
        print(f"✗ Error seeding catalog: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_catalog()
