# Como Conectar o Mobile à API

## Configuração da URL da API

O mobile agora busca dados da API backend. A URL está configurada em:

**Arquivo:** `src/services/api.js`

```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

### Cenários de Desenvolvimento:

#### 1. Testando no Simulador iOS/Android (localhost funciona)
```javascript
const API_BASE_URL = 'http://localhost:8000/api';
```

#### 2. Testando no Expo Go em Celular Físico
Você precisa usar o IP da sua máquina:

```javascript
// Windows: ipconfig (procure "IPv4 Address")
// Mac/Linux: ifconfig (procure "inet")
const API_BASE_URL = 'http://192.168.X.X:8000/api';
```

**Exemplo:**
```javascript
const API_BASE_URL = 'http://192.168.1.100:8000/api';
```

---

## Passo a Passo para Testar

### 1. Rodar o Backend

```bash
# Terminal 1: Backend
cd "C:\Users\aliss\SPETCH\Projeto Mirror\backend"
venv\Scripts\activate
uvicorn app.main:app --reload
```

Verificar que está rodando: http://localhost:8000/docs

### 2. Atualizar URL da API (se necessário)

Se estiver testando em celular físico:

1. Descobrir IP da máquina:
```bash
ipconfig
# Procurar "Adaptador de Rede sem Fio" → "Endereço IPv4"
# Exemplo: 192.168.1.100
```

2. Editar `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://192.168.1.100:8000/api';
```

### 3. Rodar o Mobile

```bash
# Terminal 2: Mobile
cd "C:\Users\aliss\SPETCH\Projeto Mirror\Mirror-Mobile\Mirror-Mobile"
npm start
```

### 4. Testar Conexão

Quando o app abrir:

- ✅ **Sucesso:** Você verá os produtos do catálogo (X-Salada, X-Bacon, etc.)
- ✅ **Filtros:** Clicar nas categorias filtra os produtos
- ✅ **Pull-to-refresh:** Arrastar a tela pra baixo recarrega

#### Se aparecer erro:

**"Não foi possível carregar os produtos"**

1. Verificar se backend está rodando: http://localhost:8000/docs
2. Verificar URL em `src/services/api.js`
3. Se estiver em celular físico:
   - Máquina e celular na mesma rede Wi-Fi?
   - URL com IP correto?
   - Firewall do Windows bloqueando porta 8000?

---

## O Que Foi Implementado

### Backend (FastAPI)
- ✅ GET /api/categories - Lista categorias
- ✅ GET /api/products - Lista produtos (filtro opcional por categoria)
- ✅ GET /api/products/{id} - Detalhes do produto com opções

### Mobile (React Native)
- ✅ `src/services/api.js` - Cliente HTTP com fetch
- ✅ `src/context/ProductsContext.jsx` - Gerenciamento de estado
- ✅ `ProductGrid.jsx` - Consome API, mostra loading/erro, pull-to-refresh
- ✅ `CategoryFilter.jsx` - Usa categorias da API, filtra produtos
- ✅ Formatação de preços: centavos → R$ (ex: 2900 → R$ 29,00)

### Dados Reais
Agora o mobile mostra:
- 5 categorias reais (Hambúrgueres, Bebidas, etc.)
- 13 produtos reais com preços corretos
- Tempo de preparo real
- Sem mais dados mockados!

---

## Próximos Passos

1. ⏳ Tela de detalhes do produto (ao clicar no card)
2. ⏳ Mostrar opções de customização (queijo, ponto da carne, extras)
3. ⏳ Carrinho de compras
4. ⏳ Checkout e integração Mercado Pago

---

## Troubleshooting

### Erro: Network request failed

**Problema:** Mobile não consegue conectar à API

**Soluções:**
1. Backend está rodando? `uvicorn app.main:app --reload`
2. URL correta em `api.js`?
3. Se celular físico: mesmo Wi-Fi + IP correto
4. Firewall do Windows: permitir porta 8000

### Produtos não aparecem mas sem erro

**Problema:** API retorna lista vazia

**Soluções:**
1. Banco populado? `python -m scripts.seed_catalog`
2. Categorias existem? GET http://localhost:8000/api/categories
3. Produtos existem? GET http://localhost:8000/api/products

### Preços aparecem errados

**Problema:** Formatação incorreta

**Verificar:** `formatPrice()` está sendo usado? Deve converter centavos → R$
```javascript
formatPrice(2900) // → "R$ 29,00"
```
