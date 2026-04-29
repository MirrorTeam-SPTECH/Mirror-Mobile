"""
SQLAlchemy models for nutrition domain.

INGREDIENT table is READ-ONLY from backend perspective.
Data is written by Medallion pipeline (Bronze → Silver → Gold).
"""
from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Ingredient(Base):
    """
    Ingredient nutrition data.

    Populated by Medallion pipeline from PNAE/TACO data.
    Backend treats this as read-only.

    All nutritional values are per 100g.
    """
    __tablename__ = "ingredient"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # pães, carnes, queijos, etc
    kcal_per_100g = Column(Float, nullable=False)
    protein_g = Column(Float, nullable=False)
    carb_g = Column(Float, nullable=False)
    fat_g = Column(Float, nullable=False)
    sodium_mg = Column(Float, nullable=False)

    def __repr__(self):
        return f"<Ingredient(id={self.id}, name={self.name}, category={self.category})>"


class ProductIngredient(Base):
    """
    Ingredients that make up a product's base recipe.

    This is the default composition BEFORE any customization options.

    Composite primary key (product_id, ingredient_id).
    """
    __tablename__ = "product_ingredient"

    product_id = Column(Integer, ForeignKey("product.id"), primary_key=True)
    ingredient_id = Column(Integer, ForeignKey("ingredient.id"), primary_key=True)
    default_grams = Column(Integer, nullable=False)  # Grams of this ingredient

    # Relationships
    product = relationship("Product", back_populates="product_ingredients")
    ingredient = relationship("Ingredient")

    def __repr__(self):
        return f"<ProductIngredient(product_id={self.product_id}, ingredient_id={self.ingredient_id}, grams={self.default_grams})>"
