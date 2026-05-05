# Portal do Churras

Super-app mobile para um food truck de hambúrguer artesanal.
Projeto universitário, time pequeno, cliente real.

---

## Stack

- **Mobile**: Expo 54 + React Native 0.81.5, React Navigation 7, AsyncStorage, expo-image-picker, **expo-location** (instalado via `npx expo install expo-location`)
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
   ├── Orders service     — catálogo, pedidos, favoritos, top-product, MP: tudo OK
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
2. **Geolocalização**: alerta quando o cliente está perto do food truck (300 m); sugestão do "lanche de sempre" baseada no produto mais pedido — **implementado**
3. **Fidelidade**: cartão de selos (10 hambúrgueres = 1 combo grátis); só pedidos com ≥1 hambúrguer contam; bebidas/acompanhamentos sozinhos não contam — **implementado**
4. **Churrasqueiro de bolso**: imagem + áudio → Claude analisa ponto da carne e qualidade do corte
5. **Scanner comparativo**: OCR do rótulo de um lanche concorrente → sugestão de equivalente do Portal do Churras

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

## Sistema de design — Mobile

Todas as telas novas seguem este padrão (não misturar com estilos antigos `#f5f5f5`/`#333`):

| Token | Valor | Uso |
|-------|-------|-----|
| `BG` | `#FAF5EC` | Fundo de todas as telas |
| `INK` | `#2A1E14` | Texto principal |
| `PRIMARY` | `#D91C1C` | Vermelho — botões, ícones ativos |
| `SUBTLE` | `#8A7558` | Labels secundários, ícones inativos |
| `LINE` | `#E8DFD1` | Bordas de cards |
| `MUTED` | `#7A6A56` | Texto de descrição |
| `SERIF` | `Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" })` | Títulos e headings |

**Padrão de tela:**
```jsx
<SafeAreaView style={{ flex: 1, backgroundColor: "#FAF5EC" }}>
  <StatusBar style="dark" />
  <View style={topBar}>           {/* label uppercase + título serif */}
    <Text style={topLabel}>Portal do Churras</Text>
    <Text style={topTitle}>Nome da tela</Text>
  </View>
  <ScrollView>
    {/* cards com borderWidth: 1, borderColor: LINE, borderRadius: 14 */}
  </ScrollView>
</SafeAreaView>
```

Telas que já seguem este padrão: `HomeScreen`, `ProfileScreen`, `ProximityScreen`, `FavoritesScreen`, `LoyaltyScreen`, `ProductCard`, `SearchBar`, `CategoryFilter`, `TopBar`.

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

## Estado atual (2026-05-05)

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
- [x] `GET /api/orders/top-product` — funcionando (produto mais pedido pelo usuário via `SUM(quantity)`; retorna `{ product_id, name, total_quantity }`; **deve ficar antes de `/{order_id}` no routes.py** para evitar colisão de path)
- [x] `GET /api/loyalty` — funcionando (selos de fidelidade: filtra ordens não canceladas com ≥1 item da categoria "Hambúrgueres"; retorna `total_stamps`, `stamps_in_cycle`, `cycles_completed`, `recent_stamps`; schemas `LoyaltyStampItem` + `LoyaltyResponse` em `schemas.py`)
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
- [x] **Auth: auto-logout em qualquer 401** — `api.js` expõe `setOnUnauthorized(callback)`; chamado quando qualquer resposta retorna 401; `AuthContext` registra o callback para limpar token e `setUser(null)` automaticamente
- [x] GrillAdvisorScreen integrada com `/grill-advisor` — câmera + galeria; webcam real no browser via `WebCameraModal.web.jsx`
- [x] LabelScannerScreen integrada com `/label-scanner` — câmera + galeria; webcam real no browser via `WebCameraModal.web.jsx`
- [x] `WebCameraModal.web.jsx` — modal de webcam para Expo Web usando `getUserMedia` + `ReactDOM.createPortal`; stub native em `WebCameraModal.jsx`
- [x] **ProfileScreen** redesenhada no sistema de design novo (cream/serif/Ionicons/cards com borda `LINE`); menu: Meus Pedidos (OrderHistory), Perto de Você (Nearby via Stack), Churrasqueiro de Bolso (GrillAdvisor), Scanner Comparativo (LabelScanner), logout
- [x] **CartScreen**: botão `←` no header (volta para `HomeTab`); tab bar oculta via `options={{ tabBarStyle: { display: "none" } }}` para não cobrir o botão "Finalizar Pedido"; usa `PRODUCT_IMAGES[item.productId]` para imagem local; fallback: placeholder colorido por `productId % 8` com emoji 🍔
- [x] **ProximityScreen**: geolocalização real via `expo-location`; distância calculada por Haversine (linha reta); raio de alerta: 300 m; food truck: Rua Domingos Giglio 81, Pirituba SP (-23.481362, -46.711614); exibe produto mais pedido (`/top-product`) quando perto; exibe endereço do food truck sempre; **acessível apenas como Stack screen** (via ProfileScreen "Perto de Você") — não está mais na tab bar; botão voltar via `useNavigation()`
- [x] **LoyaltyScreen**: cartão de selos (10 bolinhas — vermelha com ✓ se preenchida, branca com número se vazia); banner dourado quando `cycles_completed > 0`; lista dos últimos 10 carimbos; regra visível ("só hambúrguer conta"); `getLoyalty()` em `api.js`; tab "Loyalty" com ícone `star-outline`; botão voltar via `useNavigation()`
- [x] **FavoritesScreen**: redesenhada no sistema de design novo (cream/serif/Ionicons, cards com borda `LINE`, imagem local via `PRODUCT_IMAGES`); botão voltar via `useNavigation()`; substituiu estilos legados `#f5f5f5`/`#333`
- [x] **Tab bar**: 5 tabs — HomeTab, **Loyalty** (estrela), Orders (carrinho), Favorites (coração), ProfileTab
- [x] **Botões de voltar**: padrão `useNavigation()` + `navigation.goBack()` em todas as telas secundárias (ProximityScreen, LoyaltyScreen, FavoritesScreen). **Não usar `canGoBack()` fora do `onPress`** — avaliado no momento do clique, não no render
- [x] **Sistema de imagens locais**: `assets/images/` + `src/services/productImages.js` (mapeamento `id → require()`); X-Salada (id=1) com imagem `x-salada.jpeg`; `ProductCard`, `FavoritesScreen` e `CartScreen` usam imagem local quando disponível, placeholder colorido quando não; estilo de imagem usa dimensões explícitas em pixels (`position: absolute, top: 0, left: 0, width: "100%", height: <px>`) — **não usar `StyleSheet.absoluteFill` em `Image`**, causa esticamento
- [x] `api.js` lê URL via `process.env.EXPO_PUBLIC_API_URL` com fallback `http://localhost:8000/api`
- [ ] SearchBar ainda visual apenas (sem `onChangeText`/state)
- [ ] Imagens de produtos: 12/13 produtos ainda sem imagem (apenas X-Salada tem)
- [ ] Cache offline (AsyncStorage para menu/histórico) — não implementado

---

## Próximos passos (ordem de prioridade)

### Prioridade 1 — Validar IA com chave real
1. Configurar `CLAUDE_API_KEY` real no `backend/.env` (gerar em https://console.anthropic.com/settings/keys)
2. Testar fim-a-fim: GrillAdvisorScreen, LabelScannerScreen, modal de nutrição em OrderHistoryScreen
3. Em modo dev sem chave, considerar mockar respostas para destravar UI

### Prioridade 2 — UX e polish do mobile
4. SearchBar funcional: state + filtragem de produtos no `ProductsContext`
5. Imagens de produtos: adicionar fotos reais dos 12 produtos restantes em `assets/images/` e mapear em `productImages.js`
6. Deletar `BottomNavBar.jsx` (código morto, substituído pelo Tab Navigator)
7. Migrar estilos legados de `CartScreen.jsx` e `CheckoutScreen.jsx` para o sistema de design novo

### Prioridade 3 — Push Notifications
7. Adicionar `expo-notifications` no `package.json`
8. Setup Expo Push no mobile (permissões, registro de token)
9. Endpoint backend para registrar token do usuário
10. Disparar push em transições de status (`paid`, `ready`) no `OrderRepository`

### Prioridade 4 — Cache offline
11. Cachear menu (`/products`, `/categories`) em AsyncStorage com TTL
12. Cachear `/orders` localmente para histórico funcionar sem rede

### Fases posteriores
- LGPD: endpoint de exportação e exclusão de dados

---

## Convenções de código

### Mobile (React Native / Expo)

- **Preços em state/props**: sempre centavos (int). Formatar só na UI com `formatPrice()` de `services/api.js`
- **Alertas nativos**: usar `Alert.alert` do `react-native`. **Atenção:** `Alert.alert` com múltiplos botões **não funciona no Expo Web** — o browser ignora a lista de botões. Para seleção de fonte de imagem (câmera vs galeria), usar botões diretos na UI em vez de Alert. Para câmera no web, usar `WebCameraModal` (ver componente).
- **Favoritos**: `FavoritesContext` — nunca estado local no card
- **Navegação**: Tab Navigator (`@react-navigation/bottom-tabs`) aninhado em Stack. `BottomNavBar.jsx` é código morto (não usado), pode ser deletado
- **Auth**: token JWT é persistido em AsyncStorage com chave `@portal_churras:token`. `AuthContext` faz `getMe()` ao abrir o app para restaurar sessão; em caso de erro (401), limpa o token. Qualquer resposta 401 em qualquer chamada dispara auto-logout via `setOnUnauthorized`. Sempre usar `useAuth()` em vez de manipular AsyncStorage diretamente
- **API base URL**: vem de `process.env.EXPO_PUBLIC_API_URL` (definida no `.env` do mobile). Para device físico testando, use o IP da máquina (ex: `EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api`), não `localhost`
- **Imagens de produtos**: usar assets locais via `require()` em `src/services/productImages.js`. **O arquivo de imagem deve existir em `assets/images/` antes de adicionar o `require()` e iniciar o Metro** — caso contrário o bundler falha com 500. Nunca hotlink externo
- **Estilo de imagem de produto**: usar dimensões explícitas em pixels, nunca `StyleSheet.absoluteFill` em componente `Image` — causa esticamento em alguns contextos RN. Padrão: `{ position: "absolute", top: 0, left: 0, width: "100%", height: <valor_px> }` com `resizeMode="cover"` e `overflow: "hidden"` no container pai
- **Design system**: usar sempre os tokens do sistema de design novo (ver seção "Sistema de design"). Não criar novas telas com `backgroundColor: "#f5f5f5"` ou `color: "#333"` — usar `BG`, `INK`, `PRIMARY`, etc.
- **Estilos legados**: `#C41E3A` (accent antigo) ainda aparece em CartScreen/CheckoutScreen — ao tocar nessas telas, migrar para o sistema novo
- **Botão de voltar**: usar `useNavigation()` do `@react-navigation/native` em componentes auxiliares (ex: `TopBar`). Chamar `navigation.goBack()` dentro do `onPress` — nunca avaliar `canGoBack()` fora do handler, pois no render inicial pode retornar `false` mesmo com pilha válida

### Backend (FastAPI / Python)

- **Estrutura modular por domínio**: `routes.py`, `models.py`, `schemas.py`, `services.py`, `repository.py`
- **Pydantic** para validação de entrada e schemas de saída. Nunca retornar modelo ORM direto
- **Migrations com Alembic**. Toda mudança de schema passa por migration versionada
- **Nunca retornar senha, hash, ou tokens em responses**
- **Env vars via `pydantic-settings`**. Nada de `os.environ` espalhado
- **Logs estruturados** (JSON)
- **Timezones**: UTC no banco. Converter pra America/Sao_Paulo só na apresentação
- **Ao importar novos domains com models**, adicionar o import em `main.py` para garantir que SQLAlchemy resolva relacionamentos cross-domain (ex: `Option → Ingredient`)
- **Rotas com path literal antes de path parameter**: ex. `/orders/top-product` deve ser declarado **antes** de `/orders/{order_id}` no mesmo router, senão FastAPI roteia "top-product" como inteiro e retorna 422

### Git

- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Commits em português (padrão já estabelecido no projeto)
- PRs pequenos (< 400 linhas idealmente)

---

## Dívidas técnicas pendentes

| Arquivo | Problema | Prioridade |
|---------|----------|-----------|
| `backend/.env` | `CLAUDE_API_KEY=your-claude-key` (placeholder) — endpoints de IA devolvem 503 até trocar pela chave real | Alta |
| `backend/.env` | `CORS_ORIGINS=["*"]` — libera todas as origens; ok para dev, restringir antes de produção | Baixa (prod) |
| `seed_catalog.py` | `image_url` ausente em 12/13 produtos (X-Salada já tem imagem local) | Média |
| `SearchBar.jsx` | Componente sem `onChangeText`/state — apenas visual | Média |
| `BottomNavBar.jsx` | Componente morto (não importado em lugar nenhum) — deletar | Baixa |
| Backend `push/services.py` | Métodos `send_*` são stubs (`pass`) | Pendente (ver Prioridade 3) |
| `CartScreen.jsx` / `CheckoutScreen.jsx` | Estilos legados (`#f5f5f5`, `#C41E3A`, `#333`) — migrar para o sistema de design novo quando tocar nessas telas | Baixa |
| `backend/app/domains/orders/` | `GET /loyalty` não tem migration Alembic pois só lê tabelas existentes, mas se mudar schema no futuro precisa versionar | Nota |

---

## Segurança e privacidade

- Dados de cartão **nunca** tocam nosso backend — tokenização pelo SDK do Mercado Pago
- Geolocalização só com consentimento explícito. No MVP, só em foreground (via `requestForegroundPermissionsAsync`)
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
- **2026-05-04** — CORS fixado para dev: `CORS_ORIGINS=["*"]` no `backend/.env` (antes estava restrito a 8081/3000, bloqueava Expo Web na 8082+)
- **2026-05-04** — Câmera no Expo Web: `Alert.alert` com múltiplos botões não funciona no browser; substituído por botões diretos na UI. Webcam real implementada via `getUserMedia` + `ReactDOM.createPortal` em `WebCameraModal.web.jsx` (arquivo platform-specific — `.web.jsx` só carrega no browser, `.jsx` é stub para native)
- **2026-05-05** — Sistema de design unificado: fundo creme `#FAF5EC`, fonte serif Georgia, tokens `INK/PRIMARY/SUBTLE/LINE`. Aplicado em HomeScreen, ProfileScreen, ProximityScreen, ProductCard, TopBar, SearchBar, CategoryFilter
- **2026-05-05** — Auth: adicionado mecanismo de auto-logout em qualquer 401 via `setOnUnauthorized` em `api.js`; AuthContext registra o callback no boot
- **2026-05-05** — Imagens de produtos: opção por assets locais (`require()`) em vez de URLs externas. Arquivo deve existir antes do `require()` ser adicionado ao `productImages.js` — Metro falha com 500 caso contrário. Padrão: arquivo em `assets/images/`, mapeamento em `src/services/productImages.js`
- **2026-05-05** — Tab "Search" (sem funcionalidade) substituída por "Nearby" (`ProximityScreen`) com geolocalização real via `expo-location`
- **2026-05-05** — Distância ao food truck calculada por Haversine (linha reta). Difere da rota real do Google Maps (estradas) — esperado e correto para a funcionalidade de proximidade
- **2026-05-05** — CartScreen: tab bar oculta via `tabBarStyle: { display: "none" }` para não sobrepor o botão "Finalizar Pedido"; botão voltar (`←`) adicionado ao header
- **2026-05-05** — Fidelidade: `LoyaltyScreen` implementada com cartão de 10 selos; 10 hambúrgueres = 1 combo grátis; bebidas/acompanhamentos não contam; backend `GET /api/loyalty` filtra por categoria "Hambúrgueres" com `.ilike()`; tab bar substituiu "Nearby" por "Loyalty" (ícone `star-outline`); `ProximityScreen` movida para Stack (acessível via ProfileScreen)
- **2026-05-05** — FavoritesScreen redesenhada no sistema de design novo (cream/serif/cards com borda LINE, imagens locais via PRODUCT_IMAGES); eliminou últimos estilos legados da tela
- **2026-05-05** — Botões de voltar: padrão consolidado em `useNavigation()` + `goBack()` dentro do `onPress`. Bug corrigido: `canGoBack()` avaliado no render retornava `false` antes da pilha estar montada — movido para dentro do handler resolve o problema
- **2026-05-05** — Imagens no carrinho: `CartScreen` passou a usar `PRODUCT_IMAGES[item.productId]`; quando sem imagem, exibe placeholder colorido baseado em `productId % 8`. Corrigido esticamento em `ProductCard` e `FavoritesScreen`: trocado `StyleSheet.absoluteFill` por dimensões explícitas em px + `resizeMode="cover"` no `Image`

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
- **Imagens locais**: antes de adicionar `require()` em `productImages.js`, confirmar que o arquivo existe em `assets/images/`. Nunca descomentar um `require()` sem o arquivo correspondente — o Metro bundler falha com 500 em build time
- **Rotas FastAPI**: sempre declarar rotas com path literal (ex: `/orders/top-product`, `/loyalty`) antes de rotas com path parameter (ex: `/orders/{order_id}`) no mesmo router
- **Novo pacote Expo nativo** (ex: `expo-location`, `expo-notifications`): instalar com `npx expo install <pacote>` (não `npm install`). Após instalar, reiniciar Metro com `npx expo start --clear` para limpar cache
- **`useNavigation()` vs prop drilling**: para componentes auxiliares dentro de telas (ex: `TopBar`, `TopBarHeader`), usar `useNavigation()` do `@react-navigation/native` em vez de receber `navigation` por prop — evita `undefined` quando o contexto não repassa a prop corretamente
