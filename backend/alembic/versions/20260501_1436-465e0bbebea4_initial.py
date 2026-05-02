"""initial

Revision ID: 465e0bbebea4
Revises:
Create Date: 2026-05-01 14:36:55.026499

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '465e0bbebea4'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enum type for order status
    orderstatus = sa.Enum(
        'pending_payment', 'paid', 'preparing', 'ready', 'delivered', 'cancelled',
        name='orderstatus',
    )
    orderstatus.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'ingredient',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('kcal_per_100g', sa.Float(), nullable=False),
        sa.Column('protein_g', sa.Float(), nullable=False),
        sa.Column('carb_g', sa.Float(), nullable=False),
        sa.Column('fat_g', sa.Float(), nullable=False),
        sa.Column('sodium_mg', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ingredient_id', 'ingredient', ['id'], unique=False)
    op.create_index('ix_ingredient_name', 'ingredient', ['name'], unique=False)
    op.create_index('ix_ingredient_category', 'ingredient', ['category'], unique=False)

    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_id', 'user', ['id'], unique=False)
    op.create_index('ix_user_email', 'user', ['email'], unique=True)

    op.create_table(
        'category',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index('ix_category_id', 'category', ['id'], unique=False)

    op.create_table(
        'product',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('base_price_cents', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('prep_minutes', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['category.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_product_id', 'product', ['id'], unique=False)

    op.create_table(
        'option_group',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('min_select', sa.Integer(), nullable=False),
        sa.Column('max_select', sa.Integer(), nullable=False),
        sa.Column('is_required', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['product.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_option_group_id', 'option_group', ['id'], unique=False)

    op.create_table(
        'option',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('option_group_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('price_delta_cents', sa.Integer(), nullable=False),
        sa.Column('ingredient_id', sa.Integer(), nullable=True),
        sa.Column('grams', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['ingredient_id'], ['ingredient.id']),
        sa.ForeignKeyConstraint(['option_group_id'], ['option_group.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_option_id', 'option', ['id'], unique=False)

    op.create_table(
        'order',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum(
            'pending_payment', 'paid', 'preparing', 'ready', 'delivered', 'cancelled',
            name='orderstatus', create_type=False,
        ), nullable=False),
        sa.Column('pickup_code', sa.String(length=10), nullable=True),
        sa.Column('subtotal_cents', sa.Integer(), nullable=False),
        sa.Column('total_cents', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('pickup_code'),
    )
    op.create_index('ix_order_id', 'order', ['id'], unique=False)
    op.create_index('ix_order_status', 'order', ['status'], unique=False)
    op.create_index('ix_order_pickup_code', 'order', ['pickup_code'], unique=True)
    op.create_index('ix_order_created_at', 'order', ['created_at'], unique=False)
    op.create_index('idx_order_user_status', 'order', ['user_id', 'status'], unique=False)
    op.create_index('idx_order_created_at', 'order', ['created_at'], unique=False)

    op.create_table(
        'order_item',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price_cents', sa.Integer(), nullable=False),
        sa.Column('name_snapshot', sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['order.id']),
        sa.ForeignKeyConstraint(['product_id'], ['product.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_order_item_id', 'order_item', ['id'], unique=False)

    op.create_table(
        'order_item_option',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_item_id', sa.Integer(), nullable=False),
        sa.Column('option_id', sa.Integer(), nullable=False),
        sa.Column('option_name_snapshot', sa.String(length=100), nullable=False),
        sa.Column('price_delta_cents', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['option_id'], ['option.id']),
        sa.ForeignKeyConstraint(['order_item_id'], ['order_item.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_order_item_option_id', 'order_item_option', ['id'], unique=False)

    op.create_table(
        'payment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=False),
        sa.Column('mp_preference_id', sa.String(length=100), nullable=True),
        sa.Column('mp_payment_id', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('amount_cents', sa.Integer(), nullable=False),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['order.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id'),
        sa.UniqueConstraint('mp_payment_id'),
    )
    op.create_index('ix_payment_id', 'payment', ['id'], unique=False)
    op.create_index('ix_payment_mp_preference_id', 'payment', ['mp_preference_id'], unique=False)
    op.create_index('ix_payment_mp_payment_id', 'payment', ['mp_payment_id'], unique=True)

    op.create_table(
        'favorite',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['product.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('user_id', 'product_id'),
    )

    op.create_table(
        'product_ingredient',
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('ingredient_id', sa.Integer(), nullable=False),
        sa.Column('default_grams', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['ingredient_id'], ['ingredient.id']),
        sa.ForeignKeyConstraint(['product_id'], ['product.id']),
        sa.PrimaryKeyConstraint('product_id', 'ingredient_id'),
    )


def downgrade() -> None:
    op.drop_table('product_ingredient')
    op.drop_table('favorite')
    op.drop_index('ix_payment_mp_payment_id', table_name='payment')
    op.drop_index('ix_payment_mp_preference_id', table_name='payment')
    op.drop_index('ix_payment_id', table_name='payment')
    op.drop_table('payment')
    op.drop_index('ix_order_item_option_id', table_name='order_item_option')
    op.drop_table('order_item_option')
    op.drop_index('ix_order_item_id', table_name='order_item')
    op.drop_table('order_item')
    op.drop_index('idx_order_created_at', table_name='order')
    op.drop_index('idx_order_user_status', table_name='order')
    op.drop_index('ix_order_created_at', table_name='order')
    op.drop_index('ix_order_pickup_code', table_name='order')
    op.drop_index('ix_order_status', table_name='order')
    op.drop_index('ix_order_id', table_name='order')
    op.drop_table('order')
    op.drop_index('ix_option_id', table_name='option')
    op.drop_table('option')
    op.drop_index('ix_option_group_id', table_name='option_group')
    op.drop_table('option_group')
    op.drop_index('ix_product_id', table_name='product')
    op.drop_table('product')
    op.drop_index('ix_category_id', table_name='category')
    op.drop_table('category')
    op.drop_index('ix_user_email', table_name='user')
    op.drop_index('ix_user_id', table_name='user')
    op.drop_table('user')
    op.drop_index('ix_ingredient_category', table_name='ingredient')
    op.drop_index('ix_ingredient_name', table_name='ingredient')
    op.drop_index('ix_ingredient_id', table_name='ingredient')
    op.drop_table('ingredient')
    sa.Enum(name='orderstatus').drop(op.get_bind(), checkfirst=True)
