# Portal do Churras

Super-app mobile para um food truck de hambúrguer artesanal.
Projeto universitário, time pequeno, cliente real.

---

## Stack

- **Mobile**: Expo 54 + React Native 0.81.5, React Navigation 7, AsyncStorage, expo-image-picker
- **Backend**: FastAPI 0.109 + SQLAlchemy 2.0 + PostgreSQL 18 + Alembic (migration inicial aplicada)
- **Data lake**: pipeline Medallion (Bronze → Silver → Gold) sobre PNAE/TACO, já rodando
- **Auth**: JWT próprio com passlib/bcrypt — **funcionando** (register, login, me, persistência mobile)
- **Pagamento**: Mercado Pago SDK 2.2.1 — **funcionando** (preferência + webhook)
- **IA**: Claude API via `anthropic` SDK — endpoints implementados; requer `CLAUDE_API_KEY` válida
- **Push**: Expo Push Notifications (pendente)

---

## Arquitetura em 3 camadas

```
Mobile (Expo/RN)
   │
   ▼  REST/HTTPS
Backend (FastAPI)
   ├── Orders service     — catálogo, pedidos, favoritos, MP: tudo OK
   ├── Users service      — register, login (JWT/bcrypt), me: OK
   ├── Nutrition service  — cálculo SQL OK; narrativa Claude OK
   ├── AI core service    — implementado (grill-advisor, label-scanner, nutrition-ranking via Claude Vision)
   └── Push service       — estrutura criada, lógica pendente
   │
   ▼
Dados e integrações
   ├── PostgreSQL         — modelos + migration inicial aplicada (revision 465e0bbebea4)
   ├── Data Lake          — Medallion (Bronze/Silver/Gold) com PNAE enriquecida
   ├── Claude API         — via AI core service (modelo: claude-sonnet-4-6)
   └── Mercado Pago       — preferência + webhook implementados
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

Entidades principais (PostgreSQL — migration inicial aplicada, ver `backend/alembic/versions/`):

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

## Estado atual (2026-05-02)

### Backend
- [x] Estrutura modular por domínio: `orders/`, `users/`, `nutrition/`, `ai_core/`, `push/`
- [x] Modelos SQLAlchemy completos (13 entidades)
- [x] Config via `pydantic-settings`, CORS, logs estruturados (JSON)
- [x] Seed script: 5 categorias, 13 produtos, 17 grupos de opção, 56 opções, 15 ingredientes com macros
- [x] `GET /api/categories`, `GET /api/products`, `GET /api/products/{id}` — funcionando
- [x] `POST /api/orders` — funcionando (validação de opções, cálculo de subtotal, snapshots)
- [x] `GET /api/orders`, `GET /api/orders/{id}` — funcionando
- [x] `GET/POST/DELETE /api/favorites` — funcionando
- [x] Auth: `POST /register`, `POST /login` (JWT/bcrypt), `GET /me` — funcionando (register/login devolvem `access_token` + `user`)
- [x] Mercado Pago: `POST /api/orders/{id}/pay` + `POST /api/webhooks/mercadopago` — funcionando
- [x] Nutrição: `GET /api/nutrition/products/{id}` + `POST /api/nutrition/narrative` (Claude) — funcionando
- [x] Alembic migration inicial aplicada (`alembic/versions/20260501_1436-465e0bbebea4_initial.py`)
- [x] `POST /api/nutrition-ranking` — implementado (ranking SQL + narrativa Claude)
- [x] `POST /api/grill-advisor` — implementado (Claude Vision: ponto da carne + dica)
- [x] `POST /api/label-scanner` — implementado (Claude Vision: OCR rótulo + sugestão de equivalente)
- [x] Endpoints de IA devolvem **HTTP 503** quando `CLAUDE_API_KEY` é vazia ou placeholder (`your-claude-key`)
- [ ] `CLAUDE_API_KEY` ainda é placeholder no `.env` (precisa de chave real para os endpoints de IA funcionarem)
- [ ] Push: nenhuma integração

### Mobile
- [x] Navegação: Stack Navigator + Tab Navigator (5 tabs) corretamente aninhados
- [x] Onboarding com flag `hasSeenOnboarding` no AsyncStorage
- [x] HomeScreen, CartScreen, ProductDetailScreen, ProfileScreen, LoginScreen — completas
- [x] CheckoutScreen integrada: cria pedido → `POST /pay` → `Linking.openURL()` para MP
- [x] OrderTrackingScreen: polling a cada 5s, exibe status + `pickup_code`, suporta todos os estados
- [x] OrderHistoryScreen com modal de Nutrition Ranking (chama `/nutrition-ranking`)
- [x] CartContext, ProductsContext, FavoritesContext (sincronizado com backend)
- [x] AuthContext com chamadas reais à API + **persistência completa** no AsyncStorage (auto-login funciona)
- [x] GrillAdvisorScreen integrada com `/grill-advisor` (câmera + galeria via `expo-image-picker`)
- [x] LabelScannerScreen integrada com `/label-scanner` (câmera + galeria via `expo-image-picker`)
- [x] ProfileScreen com itens "Churrasqueiro de Bolso" e "Scanner Comparativo"; "Endereços" removido
- [x] `api.js` lê URL via `process.env.EXPO_PUBLIC_API_URL` com fallback `http://localhost:8000/api`
- [ ] SearchBar ainda visual apenas (sem `onChangeText`/state)
- [ ] Tab "Search" no `MainTabs` faz `e.preventDefault()` — botão sem ação
- [ ] Imagens de produtos: `image_url` é null no seed (13/13 produtos sem imagem)
- [ ] Cache offline (AsyncStorage para menu/histórico) — não implementado

---

## Próximos passos (ordem de prioridade)

### Prioridade 1 — Validar IA com chave real
1. Configurar `CLAUDE_API_KEY` real no `backend/.env` (gerar em https://console.anthropic.com/settings/keys)
2. Testar fim-a-fim: GrillAdvisorScreen, LabelScannerScreen, modal de nutrição em OrderHistoryScreen
3. Em modo dev sem chave, considerar mockar respostas para destravar UI

### Prioridade 2 — UX e polish do mobile
4. SearchBar funcional: state + filtragem de produtos no `ProductsContext`
5. Tab "Search" no `MainTabs` precisa de tela própria (hoje só `e.preventDefault()`)
6. Imagens de produtos: popular `image_url` no seed (URLs de CDN/produção, não hotlink)
7. Deletar `BottomNavBar.jsx` (código morto, substituído pelo Tab Navigator)

### Prioridade 3 — Push Notifications
8. Adicionar `expo-notifications` no `package.json`
9. Setup Expo Push no mobile (permissões, registro de token)
10. Endpoint backend para registrar token do usuário
11. Disparar push em transições de status (`paid`, `ready`) no `OrderRepository`

### Prioridade 4 — Cache offline
12. Cachear menu (`/products`, `/categories`) em AsyncStorage com TTL
13. Cachear `/orders` localmente para histórico funcionar sem rede

### Fases posteriores
- Geolocalização + alerta de proximidade do food truck
- Sugestões de "lanche de sempre" em semana de pagamento
- LGPD: endpoint de exportação e exclusão de dados

---

## Convenções de código

### Mobile (React Native / Expo)

- **Preços em state/props**: sempre centavos (int). Formatar só na UI com `formatPrice()` de `services/api.js`
- **Alertas nativos**: usar `Alert.alert` do `react-native`, nunca `confirm()` ou `alert()` do browser
- **Favoritos**: `FavoritesContext` — nunca estado local no card
- **Navegação**: Tab Navigator (`@react-navigation/bottom-tabs`) aninhado em Stack. `BottomNavBar.jsx` é código morto (não usado), pode ser deletado
- **Auth**: token JWT é persistido em AsyncStorage com chave `@portal_churras:token`. `AuthContext` faz `getMe()` ao abrir o app para restaurar sessão; em caso de erro (401), limpa o token. Sempre usar `useAuth()` em vez de manipular AsyncStorage diretamente
- **API base URL**: vem de `process.env.EXPO_PUBLIC_API_URL` (definida no `.env` do mobile). Para device físico testando, use o IP da máquina (ex: `EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api`), não `localhost`
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
| `backend/.env` | `CLAUDE_API_KEY=your-claude-key` (placeholder) — endpoints de IA devolvem 503 até trocar pela chave real | Alta |
| `seed_catalog.py` | `image_url` ausente em todos os produtos (13/13 sem imagem) | Média |
| `App.js` (MainTabs) | Tab "Search" só faz `e.preventDefault()` — botão clicável sem destino | Média |
| `SearchBar.jsx` | Componente sem `onChangeText`/state — apenas visual | Média |
| `BottomNavBar.jsx` | Componente morto (não importado em lugar nenhum) — deletar | Baixa |
| Backend `push/services.py` | Métodos `send_*` são stubs (`pass`) | Pendente (ver Prioridade 3) |

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
- **2026-05-01** — Migration Alembic inicial gerada e aplicada (`465e0bbebea4`); backend deixou de depender de `create_all()` no seed
- **2026-05-01** — Endpoints de IA (`grill-advisor`, `label-scanner`, `nutrition-ranking`) implementados com Claude Vision; telas mobile correspondentes integradas
- **2026-05-02** — Auth persistente concluído: token JWT salvo em AsyncStorage com chave `@portal_churras:token`, restauração de sessão via `getMe()` no boot
- **2026-05-02** — `CLAUDE_API_KEY` placeholder agora é tratado como "não configurado" (endpoints devolvem 503 limpo em vez de 500 com stack trace)

---

## Notas para o Claude Code

- Seguir o padrão `routes.py/schemas.py/services.py/repository.py` mesmo para features pequenas
- Preços em centavos é regra absoluta. Se ver `price: "29,00"` ou `price: 29.0`, refatorar para int
- Antes de criar tabela nova, verificar se cabe numa entidade existente
- Ao adicionar um novo domain com models, adicionar o import em `backend/app/main.py`
- Mudanças de schema **sempre** via Alembic (`alembic revision --autogenerate -m "..."` + `alembic upgrade head`); não usar `Base.metadata.create_all()` em produção
- No mobile, usar sempre `Alert.alert` (react-native), nunca `confirm()` ou `alert()` global
- Nas funções de IA (`ai_core/services.py`), usar o helper `_is_key_configured()` antes de chamar a Claude — ele cobre tanto chave vazia quanto placeholder `your-claude-key`
- `BottomNavBar.jsx` é código morto — não referenciar nem expandir, apenas deletar quando tocar na área
