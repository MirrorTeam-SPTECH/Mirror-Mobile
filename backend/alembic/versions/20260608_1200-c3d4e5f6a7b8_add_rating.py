"""add rating table

Revision ID: c3d4e5f6a7b8
Revises: f7a2b3c4d5e6
Create Date: 2026-06-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'c3d4e5f6a7b8'
down_revision = 'f7a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'rating',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('stars', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('image_base64', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('stars >= 1 AND stars <= 5', name='rating_stars_check'),
        sa.ForeignKeyConstraint(['order_id'], ['order.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id'),
    )
    op.create_index(op.f('ix_rating_id'), 'rating', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_rating_id'), table_name='rating')
    op.drop_table('rating')
