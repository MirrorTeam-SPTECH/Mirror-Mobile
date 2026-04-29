# Como rodar o projeto — Portal do Churras

---

## Pré-requisitos

| Ferramenta | Versão | Observação |
|-----------|--------|-----------|
| Python | **3.12.x** | Não usar 3.13/3.14 — faltam wheels pré-compilados |
| PostgreSQL | 14+ | Deve estar instalado e rodando |
| Node.js / npm | 18+ | Para o app mobile |
| Expo Go | Qualquer | App no celular para visualizar o mobile |

---

## Backend

### 1. Criar o banco de dados (só na primeira vez)

```bash
psql -U postgres -c "CREATE DATABASE portal_churras;"
```

Se a senha do seu PostgreSQL não for `postgres`, edite `backend/.env`:
```
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/portal_churras
```

---

### 2. Configurar o ambiente Python (só na primeira vez)

Dentro da pasta `backend/`:

```bash
py -3.12 -m venv venv
venv\Scripts\activate
pip install --upgrade pip wheel setuptools
pip install -r requirements.txt
pip install bcrypt==4.0.1
```

O venv está ativo quando aparece `(venv)` no início do terminal.

---

### 3. Gerar e aplicar as migrations (só na primeira vez)

```bash
alembic revision --autogenerate -m "initial"
alembic upgrade head
```

---

### 4. Popular o banco com dados iniciais (só na primeira vez)

```bash
python -m scripts.seed_catalog
```

Insere: 5 categorias, 13 produtos, 17 grupos de opção, 56 opções.

---

### 5. Subir o servidor

```bash
uvicorn app.main:app --reload
```

Servidor disponível em: `http://localhost:8000`

Documentação interativa (Swagger): `http://localhost:8000/docs`

---

### Próximas vezes (só ativar e subir)

```bash
# Dentro de backend/
venv\Scripts\activate
uvicorn app.main:app --reload
```

> **Configurar o banco:** copie `backend/.env.example` para `backend/.env` e ajuste `DATABASE_URL` com sua senha do PostgreSQL.

---

## Mobile

### 1. Configurar o ambiente (só na primeira vez)

Dentro de `Mirror-Mobile/Mirror-Mobile/`:

```bash
cp .env.example .env
```

Abra o `.env` e ajuste `EXPO_PUBLIC_API_URL` conforme seu ambiente:

| Situação | URL |
|----------|-----|
| Web ou iOS Simulator | `http://localhost:8000/api` |
| Emulador Android | `http://10.0.2.2:8000/api` |
| Celular físico | `http://IP_DA_SUA_MAQUINA:8000/api` |

---

### 2. Instalar dependências (só na primeira vez)

```bash
npm install
```

---

### 3. Iniciar o app

```bash
npx expo start
```

- Escaneie o QR code com o app **Expo Go** no celular
- Pressione `w` para abrir no browser
- Pressione `a` para abrir no emulador Android

---

## Endpoints disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/categories` | Lista todas as categorias |
| GET | `/api/products` | Lista produtos (aceita `?category_id=1`) |
| GET | `/api/products/{id}` | Detalhes do produto com opções de customização |

Acesse `http://localhost:8000/docs` para testar interativamente.

---

## Estrutura de pastas

```
Projeto Mirror/
├── backend/               FastAPI + PostgreSQL
│   ├── app/
│   │   ├── domains/       Módulos por domínio (orders, users, nutrition, ai_core, push)
│   │   ├── main.py        Entry point da API
│   │   ├── config.py      Configurações via .env
│   │   └── database.py    Conexão com PostgreSQL
│   ├── scripts/
│   │   └── seed_catalog.py   Popula o banco com dados iniciais
│   ├── alembic/           Migrations (ainda não geradas)
│   ├── requirements.txt
│   └── .env               Credenciais locais (não commitar)
│
└── Mirror-Mobile/
    └── Mirror-Mobile/     App Expo
        ├── src/
        │   ├── screens/   Telas do app
        │   ├── components/ Componentes reutilizáveis
        │   ├── context/   Estado global (Cart, Products, Auth, Favorites)
        │   └── services/  api.js — cliente HTTP
        └── App.js         Navegação principal
```
