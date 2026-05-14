"""add password reset token

Revision ID: f7a2b3c4d5e6
Revises: 465e0bbebea4
Create Date: 2026-05-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'f7a2b3c4d5e6'
down_revision = '465e0bbebea4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'password_reset_token',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(length=10), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_password_reset_token_token', 'password_reset_token', ['token'])


def downgrade() -> None:
    op.drop_index('ix_password_reset_token_token', 'password_reset_token')
    op.drop_table('password_reset_token')
