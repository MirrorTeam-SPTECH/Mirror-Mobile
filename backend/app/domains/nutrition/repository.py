"""
Data access layer for nutrition domain.
"""
from sqlalchemy.orm import Session


class IngredientRepository:
    """Repository pattern for ingredient data access (read-only)"""

    def __init__(self, db: Session):
        self.db = db

    def get_all(self):
        """Get all ingredients"""
        # TODO: Implement
        pass

    def get_by_id(self, ingredient_id: int):
        """Get ingredient by ID"""
        # TODO: Implement
        pass

    def search_by_name(self, name: str):
        """Search ingredients by name"""
        # TODO: Implement
        pass
