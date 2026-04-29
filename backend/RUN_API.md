# Como Rodar a API - Portal do Churras

## Setup Inicial (fazer apenas uma vez)

### 1. Instalar PostgreSQL

Se ainda não tiver instalado:
- **Windows**: https://www.postgresql.org/download/windows/
- **Linux**: `sudo apt-get install postgresql`
- **Mac**: `brew install postgresql`

### 2. Criar banco de dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE portal_churras;

# Sair
\q
```

### 3. Configurar ambiente Python

```bash
# Navegar para pasta do backend
cd "C:\Users\aliss\SPETCH\Projeto Mirror\backend"

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt
```

### 4. Configurar .env

Editar o arquivo `.env` e atualizar:

```bash
# Atualizar com suas credenciais do PostgreSQL
DATABASE_URL=postgresql://postgres:SUASENHA@localhost:5432/portal_churras
```

### 5. Criar tabelas e popular dados

```bash
# Criar todas as tabelas
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"

# Popular catálogo inicial
python -m scripts.seed_catalog
```

---

## Rodar API (toda vez)

### 1. Ativar ambiente virtual

```bash
cd "C:\Users\aliss\SPETCH\Projeto Mirror\backend"
venv\Scripts\activate
```

### 2. Iniciar servidor

```bash
uvicorn app.main:app --reload
```

### 3. Acessar

- **API**: http://localhost:8000
- **Documentação interativa (Swagger)**: http://localhost:8000/docs
- **Documentação alternativa (ReDoc)**: http://localhost:8000/redoc

---

## Endpoints Disponíveis

### Catálogo

**GET /api/categories**
- Lista todas as categorias
- Retorna: `[{id, name, sort_order}]`

**GET /api/products**
- Lista produtos
- Query params: `?category_id=1` (opcional), `?is_active=true`
- Retorna produtos SEM opções de customização

**GET /api/products/{id}**
- Detalhes de um produto específico
- Retorna produto COM todas as opções de customização
- Use este endpoint quando o usuário clicar em um produto

### Exemplo de uso:

```bash
# Listar categorias
curl http://localhost:8000/api/categories

# Listar todos os produtos
curl http://localhost:8000/api/products

# Listar hambúrgueres (category_id=1)
curl http://localhost:8000/api/products?category_id=1

# Detalhes do X-Salada com opções
curl http://localhost:8000/api/products/1
```

---

## Testar na UI (Swagger)

1. Abrir http://localhost:8000/docs
2. Expandir endpoint (ex: GET /api/products)
3. Clicar "Try it out"
4. Preencher parâmetros (se necessário)
5. Clicar "Execute"
6. Ver resposta abaixo

---

## Troubleshooting

### Erro: "database does not exist"
```bash
createdb portal_churras
```

### Erro: "relation does not exist"
```bash
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
python -m scripts.seed_catalog
```

### Erro: "No module named 'app'"
```bash
# Certifique-se de estar na pasta backend
cd "C:\Users\aliss\SPETCH\Projeto Mirror\backend"

# E com o venv ativo
venv\Scripts\activate
```

### Porta 8000 já em uso
```bash
# Usar porta diferente
uvicorn app.main:app --reload --port 8001
```
