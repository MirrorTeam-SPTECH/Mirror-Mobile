# Setup do Backend - Portal do Churras

## Passos para configurar o ambiente

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

**Nota:** A instalação pode demorar alguns minutos, especialmente o `psycopg2-binary`.

### 3. Configurar banco de dados PostgreSQL

```bash
# Instalar PostgreSQL (se ainda não tiver)
# Windows: https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql

# Criar banco de dados
createdb portal_churras

# Ou via psql:
psql -U postgres
CREATE DATABASE portal_churras;
\q
```

### 4. Configurar variáveis de ambiente

Editar o arquivo `.env` com suas credenciais reais:

```bash
# Atualizar DATABASE_URL com seu usuário/senha/porta do PostgreSQL
DATABASE_URL=postgresql://postgres:suasenha@localhost:5432/portal_churras

# Gerar SECRET_KEY seguro
# No Python:
# import secrets
# print(secrets.token_hex(32))
SECRET_KEY=sua-secret-key-gerada

# Adicionar suas chaves de API quando disponíveis
MP_ACCESS_TOKEN=...
CLAUDE_API_KEY=...
```

### 5. Gerar e aplicar migrations

```bash
# Gerar migration inicial (já criada automaticamente)
alembic revision --autogenerate -m "Initial schema"

# Aplicar migrations
alembic upgrade head
```

### 6. Iniciar servidor

```bash
uvicorn app.main:app --reload
```

API disponível em: http://localhost:8000
Docs (Swagger): http://localhost:8000/docs

## Troubleshooting

### Erro: `psycopg2` não instala no Windows

Instalar Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/

Ou usar versão wheel pré-compilada:
```bash
pip install psycopg2-binary
```

### Erro: Alembic não encontra models

Verificar que todos os models estão importados em `alembic/env.py`:
```python
from app.domains.orders import models
from app.domains.users import models
from app.domains.nutrition import models
```

### Banco criado mas tabelas não aparecem

Rodar migrations:
```bash
alembic upgrade head
```
