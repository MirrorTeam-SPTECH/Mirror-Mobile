# Portal do Churras

Super-app mobile para um food truck de hambúrguer artesanal.
Projeto universitário, time pequeno, cliente real.

---

## Stack

- **Mobile**: Expo 54 + React Native 0.81.5, React Navigation 7, AsyncStorage
- **Backend**: FastAPI 0.109 + SQLAlchemy 2.0 + PostgreSQL + Alembic (estrutura criada, migrations pendentes)
- **Data lake**: pipeline Medallion (Bronze → Silver → Gold) sobre PNAE/TACO, já rodando
- **Auth**: JWT próprio com passlib/bcrypt (já em requirements.txt) — endpoints ainda não implementados
- **Pagamento**: Mercado Pago SDK 2.2.1 (integração pendente)
- **IA**: Claude API via `anthropic` SDK (já em requirements.txt) — integração pendente
- **Push**: Expo Push Notifications (pendente)

---

## Arquitetura em 3 camadas

```
Mobile (Expo/RN)
   │
   ▼  REST/HTTPS
Backend (FastAPI)
   ├── Orders service     — catálogo OK; criar pedido/status/histórico pendente
   ├── Users service      — estrutura criada, endpoints são stubs (TODO)
   ├── Nutrition service  — estrutura criada, lógica pendente
   ├── AI core service    — estrutura criada, integração Claude pendente
   └── Push service       — estrutura criada, lógica pendente
   │
   ▼
Dados e integrações
   ├── PostgreSQL         — modelos definidos, migrations ainda não geradas
   ├── Data Lake          — Medallion (Bronze/Silver/Gold) com PNAE enriquecida
   ├── Claude API         — via AI core service (modelo: claude-sonnet-4-6)
   └── Mercado Pago       — via Orders service (com webhook)
```

---

## Features do produto

1. **Pedidos**: escolher lanche → customizar (opções pré-definidas) → pagar (MP) → acompanhar → favoritar → histórico
2. **Geolocalização**: alerta quando o cliente está perto do food truck; sugestão do "lanche de sempre" em semana de pagamento
3. **Churrasqueiro de bolso**: imagem + áudio → Claude analisa ponto da carne e qualidade do corte
4. **Scanner comparativo**: OCR do rótulo de um lanche concorrente → sugestão de equivalente do Portal do Churras

---

## Decisões de design (não negociáveis)

- **Preços sempre em centavos (int)**, nunca float, nunca string com vírgula.
  Ex: R$ 29,00 → `2900`. Formatar só na apresentação.
- **Snapshots em `ORDER_ITEM`**: `unit_price_cents` e `name_snapshot` são copiados no momento
  do pedido. Mudar preço do produto nunca reescreve o histórico.
- **Customização só pré-definida** pelo chef: `OPTION_GROUP` + `OPTION` (estilo iFood),
  não customização livre.
- **Pickup only**: sem delivery, sem mesas. Cliente retira no food truck via `pickup_code`.
- **Webhook do Mercado Pago é a ÚNICA fonte de verdade** de pagamento.
  Nunca confiar no retorno do cliente — fraude fácil.
- **Chaves de API no backend**, nunca no app. Claude API, MP tudo via proxy.
- **`INGREDIENT` é read-only do ponto de vista do backend**: quem escreve é o pipeline
  Medallion rodando periodicamente.
- **Offline-first no mobile**: food truck tem internet ruim. Cache do menu e histórico
  em AsyncStorage local.

---

## Modelo de dados — Pedidos

Entidades principais (PostgreSQL — modelos definidos, migrations pendentes):

### Core transacional
- `USER` — `id, email, name, phone, hashed_password, created_at`
- `ORDER` — `id, user_id, status, pickup_code, subtotal_cents, total_cents, notes, created_at`
- `ORDER_ITEM` — `id, order_id, product_id, quantity, unit_price_cents, name_snapshot`
- `ORDER_ITEM_OPTION` — `id, order_item_id, option_id, option_name_snapshot, price_delta_cents`
- `PAYMENT` — `id, order_id, mp_preference_id, mp_payment_id, status, amount_cents, paid_at`

### Catálogo
- `PRODUCT` — `id, category_id, name, description, base_price_cents, image_url, prep_minutes, is_active`
- `CATEGORY` — `id, name, sort_order` (Hambúrgueres, Bebidas, Acompanhamentos, Sobremesas, Combos)
- `OPTION_GROUP` — `id, product_id, name, min_select, max_select, is_required, sort_order`
  Ex: "Tipo de queijo" (required, min=1, max=1); "Extras" (optional, min=0, max=5)
- `OPTION` — `id, option_group_id, name, price_delta_cents, ingredient_id?, grams?, is_active, sort_order`
  `ingredient_id` e `grams` são opcionais — só preenchidos se a opção afetar a nutrição

### Nutrição (populado pelo Medallion)
- `INGREDIENT` — `id, name, category, kcal_per_100g, protein_g, carb_g, fat_g, sodium_mg`

### Auxiliares
- `FAVORITE` — `(user_id, product_id) PK, created_at`
- `PRODUCT_INGREDIENT` — `(product_id, ingredient_id) PK, default_grams` — receita base

### Máquina de estados do `ORDER.status`

```
pending_payment → paid → preparing → ready → delivered
       │            │         │         │
       └────────────┴─────────┴─────────┴──→ cancelled
```

Nunca atualizar status direto — sempre passar pela função de transição que valida origem→destino.

### Cálculo de nutrição de um pedido

Para cada `ORDER_ITEM`:
1. Base: soma de `INGREDIENT.kcal × grams / 100` para cada `PRODUCT_INGREDIENT`
2. Delta: para cada `ORDER_ITEM_OPTION` com `ingredient_id` não-null, somar
   `INGREDIENT.kcal × grams / 100` (grams pode ser negativo para "remover")
3. Multiplicar pela `quantity`

**Não usar LLM para o cálculo.** LLM entra só pra gerar mensagem em linguagem natural.

---

## Estado atual (2026-04-29)

### Backend
- [x] Estrutura modular por domínio: `orders/`, `users/`, `nutrition/`, `ai_core/`, `push/`
- [x] Modelos SQLAlchemy completos (13 entidades)
- [x] Config via `pydantic-settings`, CORS, logs estruturados (JSON)
- [x] Seed script: 5 categorias, 13 produtos, 17 grupos de opção, 56 opções
- [x] `GET /api/categories` — funcionando
- [x] `GET /api/products` — funcionando (com filtro por category_id)
- [x] `GET /api/products/{id}` — funcionando (com option_groups eager-loaded)
- [ ] Alembic migrations — **pasta `versions/` vazia**, nenhuma migration gerada ainda
- [ ] `POST /api/orders` — stub (501)
- [ ] `GET /api/orders` — stub (501)
- [ ] `GET /api/orders/{id}` — stub (501)
- [ ] Auth: `POST /register`, `POST /login`, `GET /me` — stubs sem lógica
- [ ] Mercado Pago: nenhuma integração
- [ ] Nutrição: nenhum endpoint implementado
- [ ] Claude API: nenhuma integração
- [ ] Push: nenhuma integração

### Mobile
- [x] Navegação: Stack Navigator + Tab Navigator (5 tabs) corretamente aninhados
- [x] Onboarding com flag `hasSeenOnboarding` no AsyncStorage
- [x] HomeScreen com TopBar, SearchBar, CategoryFilter, ProductGrid
- [x] CartScreen completa (adicionar/remover/ajustar quantidade, limpar)
- [x] ProductDetailScreen com seleção de opções (radio/checkbox) e cálculo de preço
- [x] CheckoutScreen visual completa (form + resumo + botão MP) — **sem integração real**
- [x] ProfileScreen visual (menu de itens, logout)
- [x] LoginScreen visual — **login aceita qualquer entrada, sem auth real**
- [x] CartContext com persistência AsyncStorage
- [x] ProductsContext integrado à API (categorias e produtos)
- [x] FavoritesContext funcional — **sem persistência no servidor**
- [x] AuthContext — **stub, sem persistência**
- [x] `CheckoutScreen` registrada no Stack.Navigator (App.js)
- [x] Botão "Finalizar Pedido" no CartScreen navega para CheckoutScreen
- [ ] Botão "Pagar com Mercado Pago" no CheckoutScreen — sem integração real
- [ ] OrderTrackingScreen — não existe
- [ ] OrderHistoryScreen — não existe
- [ ] SearchBar sem funcionalidade (visual apenas)
- [ ] Tab "Search" e tab "Favorites" bloqueados (preventDefault)
- [ ] `api.js` com URL hardcoded `http://localhost:8000` (precisa de config por ambiente)
- [ ] Imagens de produtos: `image_url` é null no seed, todas imagens quebradas

---

## Próximos passos (ordem de prioridade)

### Prioridade 1 — Fluxo de pedido (core do app)
1. Gerar migration Alembic inicial (`alembic revision --autogenerate -m "initial"`)
2. Implementar auth mínimo: `POST /register`, `POST /login` (JWT), `GET /me`
3. Implementar `POST /api/orders` com cálculo de total e geração de `pickup_code`
4. Implementar `GET /api/orders` e `GET /api/orders/{id}`
5. Integrar Mercado Pago: criar preferência em `POST /api/orders/{id}/pay`
6. Implementar webhook: `POST /api/webhooks/mercadopago` (única fonte de verdade)
7. Conectar mobile: AuthContext → API real, CheckoutScreen → POST /orders + abrir MP
8. Criar `OrderTrackingScreen` (polling de status + pickup_code)

### Prioridade 2 — Auth e persistência
9. Persistir token JWT no AsyncStorage (auto-login)
10. Sincronizar FavoritesContext com backend (endpoints de favoritos)

### Prioridade 3 — Nutrição e IA
11. Implementar endpoints de nutrição (cálculo SQL puro)
12. Integrar Claude API para narrativa nutricional
13. Grill Advisor e Label Scanner (Claude Vision)

### Fases posteriores
- Geolocalização e alertas de proximidade
- Push notifications por status de pedido
- Sugestões de payday
- Histórico offline (SQLite local)

---

## Convenções de código

### Mobile (React Native / Expo)

- **Preços em state/props**: sempre centavos (int). Formatar só na UI com `formatPrice()` de `services/api.js`
- **Alertas nativos**: usar `Alert.alert` do `react-native`, nunca `confirm()` ou `alert()` do browser
- **Favoritos**: `FavoritesContext` — nunca estado local no card
- **Navegação**: Tab Navigator (`@react-navigation/bottom-tabs`) aninhado em Stack. `BottomNavBar.jsx` é código morto (não usado), pode ser deletado
- **Auth**: stub atual não persiste. Não confiar nele pra lógica real
- **URLs de imagem**: só URLs de produção/CDN. Evitar hotlinks externos
- **Estilos**: paleta principal — vermelho `#D91C1C` (primary), vinho `#8B1C1C` (primary-dark), `#740000` (cta), `#C41E3A` (accent)

### Backend (FastAPI / Python)

- **Estrutura modular por domínio**: `routes.py`, `models.py`, `schemas.py`, `services.py`, `repository.py`
- **Pydantic** para validação de entrada e schemas de saída. Nunca retornar modelo ORM direto
- **Migrations com Alembic**. Toda mudança de schema passa por migration versionada
- **Nunca retornar senha, hash, ou tokens em responses**
- **Env vars via `pydantic-settings`**. Nada de `os.environ` espalhado
- **Logs estruturados** (JSON)
- **Timezones**: UTC no banco. Converter pra America/Sao_Paulo só na apresentação
- **Ao importar novos domains com models**, adicionar o import em `main.py` para garantir que SQLAlchemy resolva relacionamentos cross-domain (ex: `Option → Ingredient`)

### Git

- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Commits em português (padrão já estabelecido no projeto)
- PRs pequenos (< 400 linhas idealmente)

---

## Dívidas técnicas pendentes

| Arquivo | Problema | Prioridade |
|---------|----------|-----------|
| `BottomNavBar.jsx` | Componente morto (não importado em lugar nenhum) — deletar | Baixa |
| `api.js` | URL hardcoded `http://localhost:8000` | Alta (antes de prod) |
| `FavoritesContext.jsx` | Sem persistência (perde ao reabrir app) | Média |
| `AuthContext.jsx` | Stub sem persistência — migrar pra auth real | Alta |
| `ProfileScreen.jsx` | Item "Endereços" no menu não faz sentido (pickup-only) | Baixa |
| Seed script | `image_url = null` em todos os produtos — imagens quebradas | Média |

---

## Segurança e privacidade

- Dados de cartão **nunca** tocam nosso backend — tokenização pelo SDK do Mercado Pago
- Geolocalização só com consentimento explícito. No MVP, só em foreground
- Dados nutricionais são **orientativos** — colocar disclaimer visível sempre que exibir ranking calórico
- LGPD: prever endpoint de exportação e exclusão de dados do usuário antes do lançamento público

---

## Histórico de decisões

- **2026-04-19** — Arquitetura em 3 camadas: Mobile → FastAPI → Dados/Integrações
- **2026-04-19** — Customização de lanche é só pré-definida (estilo iFood). Modelo: `OPTION_GROUP` + `OPTION`
- **2026-04-19** — Pickup-only. Sem delivery, sem mesas
- **2026-04-19** — AI concentrada num único `ai_core` service para rate limit e prompt templates centralizados
- **2026-04-19** — Nutrição: ranking é SQL puro. LLM só pra formatar mensagem em PT-BR
- **2026-04-29** — Auth: optado por JWT próprio (passlib/bcrypt já instalado) em vez de Firebase/Supabase para simplificar o setup universitário
- **2026-04-29** — Modelo Claude padrão atualizado para `claude-sonnet-4-6`

---

## Notas para o Claude Code

- Seguir o padrão `routes.py/schemas.py/services.py/repository.py` mesmo para features pequenas
- Preços em centavos é regra absoluta. Se ver `price: "29,00"` ou `price: 29.0`, refatorar para int
- Antes de criar tabela nova, verificar se cabe numa entidade existente
- Ao adicionar um novo domain com models, adicionar o import em `backend/app/main.py`
- No mobile, usar sempre `Alert.alert` (react-native), nunca `confirm()` ou `alert()` global
- `BottomNavBar.jsx` é código morto — não referenciar nem expandir, apenas deletar quando tocar na área
