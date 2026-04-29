# Portal do Churras - Backend

FastAPI backend para o app mobile Portal do Churras.

## Estrutura do Projeto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings (pydantic-settings)
│   ├── database.py          # SQLAlchemy setup
│   └── domains/
│       ├── orders/          # Pedidos, catálogo, customização
│       ├── users/           # Autenticação e perfil
│       ├── nutrition/       # Dados nutricionais (Medallion Gold)
│       ├── ai_core/         # Integração Claude API
│       └── push/            # Push notifications
├── alembic/                 # Database migrations
├── scripts/                 # Seed scripts
├── requirements.txt
├── .env.example
└── README.md
```

## Setup Rápido

### 1. Criar e ativar ambiente virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar PostgreSQL

```bash
# Criar banco de dados
createdb portal_churras

# Ou via psql:
psql -U postgres
CREATE DATABASE portal_churras;
\q
```

### 4. Configurar variáveis de ambiente

Editar `.env` com suas credenciais:

```bash
DATABASE_URL=postgresql://postgres:suasenha@localhost:5432/portal_churras
SECRET_KEY=gerar-com-secrets-token-hex-32
```

### 5. Criar tabelas e popular catálogo

```bash
# Criar tabelas
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Popular catálogo
python -m scripts.seed_catalog
```

### 6. Iniciar servidor

```bash
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Catálogo Inicial

O script `seed_catalog.py` popula:

### Categorias (5)
- Hambúrgueres
- Bebidas
- Acompanhamentos
- Sobremesas
- Combos

### Produtos (13)

**Hambúrgueres:**
- X-Salada - R$ 29,00
- X-Bacon - R$ 34,00
- X-Gordão - R$ 42,00
- X-Frango - R$ 32,00
- X-Vegetariano - R$ 31,00

**Bebidas:**
- Refrigerante Lata - R$ 5,00
- Suco Natural - R$ 8,00
- Água Mineral - R$ 3,00

**Acompanhamentos:**
- Batata Frita - R$ 12,00
- Onion Rings - R$ 15,00

**Sobremesas:**
- Brownie com Sorvete - R$ 18,00

**Combos:**
- Combo X-Salada - R$ 40,00
- Combo X-Bacon - R$ 45,00

### Customizações

Cada hambúrguer tem:
- **Tipo de Queijo** (obrigatório): Prato, Cheddar (+R$ 2), Suíço (+R$ 3)
- **Ponto da Carne** (obrigatório): Mal, Ao Ponto, Bem Passado
- **Extras** (opcional, até 5): Bacon (+R$ 5), Ovo (+R$ 3), Cebola Caramelizada (+R$ 2), Picles (+R$ 1), Hambúrguer Extra (+R$ 8)

## Convenções

- **Preços em centavos**: `2900` = R$ 29,00
- **Snapshots**: ORDER_ITEM salva preço no momento do pedido
- **Estado do pedido**: pending_payment → paid → preparing → ready → delivered
- **Webhook MP**: única fonte de verdade para pagamentos

## Próximos Passos

1. ✅ Estrutura base criada
2. ✅ Models SQLAlchemy implementados
3. ✅ Catálogo inicial populado
4. ⏳ Endpoints de catálogo (GET /products, GET /categories)
5. ⏳ Endpoints de pedidos (POST /orders, GET /orders/:id)
6. ⏳ Integração Mercado Pago
7. ⏳ Conectar mobile ao backend

## Troubleshooting

Ver `setup.md` para detalhes completos.
