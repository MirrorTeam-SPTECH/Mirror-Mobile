# Portal do Churras

> Super-app para um food truck de hambúrguer artesanal.
> Projeto integrador universitário — time pequeno, cliente real.

---

## O que é o Portal do Churras?

É um aplicativo mobile completo para o food truck "Portal do Churras", localizado em Pirituba, São Paulo. O app cobre toda a jornada do cliente — desde navegar pelo cardápio até retirar o pedido — com funcionalidades extras de fidelidade e inteligência artificial.

---

## O que o cliente consegue fazer?

### Pedir um lanche
O cliente abre o app, navega pelo cardápio dividido em categorias (Hambúrgueres, Bebidas, Acompanhamentos, Sobremesas, Combos), escolhe o produto, personaliza (tipo de queijo, extras, etc.) e finaliza o pagamento pelo Mercado Pago. Depois é só acompanhar o status do pedido em tempo real e retirar usando o código gerado pelo app.

### Fidelidade
A cada pedido que contém pelo menos um hambúrguer, o cliente ganha um selo no cartão de fidelidade. Com 10 selos, ganha um combo grátis. Bebidas e acompanhamentos sozinhos não contam — é uma regra de negócio pensada com o dono do food truck.

### Perto de você
O app usa a localização do celular para avisar quando o cliente estiver a menos de 300 metros do food truck. Se já tiver histórico de pedidos, sugere automaticamente o lanche que o cliente mais pede.

### Churrasqueiro de Bolso
O cliente tira uma foto da carne na churrasqueira e o app diz o ponto (mal passado, ao ponto, bem passado) e dá uma dica de preparo. Isso usa visão computacional da IA da Anthropic (Claude).

### Scanner Comparativo
O cliente aponta a câmera para o rótulo ou embalagem de um lanche de outro lugar. O app lê o rótulo e sugere qual produto do Portal do Churras seria o equivalente.

---

## Como funciona por dentro?

### Mobile (o app)
Feito com **React Native + Expo**, que permite gerar um app que roda tanto em Android quanto em iOS e no navegador a partir de um único código. A navegação entre telas usa o React Navigation. O app guarda o token de login localmente para o usuário não precisar fazer login toda vez.

### Backend (o servidor)
Feito em **Python com FastAPI**, um framework moderno e eficiente. O servidor expõe uma API REST que o app consome. Ele cuida de tudo: catálogo de produtos, pedidos, autenticação, pagamentos e as features de IA.

### Banco de dados
**PostgreSQL**, banco de dados relacional robusto. As tabelas foram desenhadas para refletir a realidade do negócio: pedidos com snapshot de preço (o histórico nunca muda mesmo que o preço do produto mude), opções de personalização por grupo, ingredientes com macros nutricionais.

### Pagamento
Integrado com o **Mercado Pago**: o app abre a página de pagamento do MP e o servidor recebe uma notificação automática (webhook) quando o pagamento é confirmado. O app nunca lida com dados de cartão diretamente.

### Inteligência Artificial
Usamos a **API da Anthropic (Claude)** para três features:
- Churrasqueiro de Bolso — análise de imagem da carne
- Scanner Comparativo — leitura de rótulo e sugestão de produto
- Narrativa nutricional — texto em linguagem natural sobre as calorias de um pedido

---

## Telas do app

| Tela | O que faz |
|------|-----------|
| Onboarding | Apresenta o app em 3 slides para novos usuários |
| Login / Cadastro | Autenticação com e-mail e senha |
| Home | Catálogo de produtos com filtro por categoria e busca |
| Detalhe do produto | Foto, descrição, personalização e botão de adicionar ao carrinho |
| Carrinho | Revisa os itens, ajusta quantidades, vai para o checkout |
| Checkout | Resumo do pedido e botão de pagamento (Mercado Pago) |
| Acompanhar Pedido | Status em tempo real (atualiza a cada 5 segundos) + código de retirada |
| Histórico | Lista de pedidos anteriores com resumo nutricional por pedido |
| Favoritos | Produtos curtidos pelo usuário |
| Fidelidade | Cartão de selos (10 hambúrgueres = 1 combo grátis) |
| Perto de Você | Distância ao food truck em tempo real + sugestão do lanche favorito |
| Churrasqueiro de Bolso | Análise de ponto da carne por foto (IA) |
| Scanner Comparativo | Leitura de rótulo de concorrente por foto (IA) |
| Perfil | Dados do usuário, acesso rápido às features e logout |

---

## Estrutura do projeto

```
Mirror-Mobile/
├── Mirror-Mobile/          ← Código do app (React Native / Expo)
│   ├── src/
│   │   ├── screens/        ← Uma pasta por tela
│   │   ├── components/     ← Componentes reutilizáveis (cards, filtros, etc.)
│   │   ├── context/        ← Estado global (carrinho, favoritos, auth)
│   │   └── services/       ← Comunicação com a API e imagens locais
│   ├── assets/images/      ← Fotos dos produtos
│   └── App.js              ← Ponto de entrada e configuração de navegação
│
└── backend/                ← Servidor (Python / FastAPI)
    └── app/
        └── domains/        ← Módulos por domínio de negócio
            ├── orders/     ← Catálogo, pedidos, favoritos, fidelidade
            ├── users/      ← Autenticação
            ├── nutrition/  ← Cálculo nutricional
            └── ai_core/    ← Features de IA (Claude)
```

---

## Decisões que fizemos e por quê

**Preços em centavos inteiros** — Evita erros de arredondamento com ponto flutuante. R$ 29,00 vira `2900` no banco e no app. Só converte para exibição na tela.

**Pickup only (sem delivery)** — O food truck não faz entrega. O cliente retira no local com um código gerado no momento do pagamento.

**IA no backend, nunca no app** — A chave da API do Claude fica no servidor. O app nunca tem acesso direto. Isso evita que a chave vaze e permite controlar o uso.

**Webhook como fonte de verdade para pagamento** — Quando alguém paga pelo Mercado Pago, o MP manda uma notificação diretamente para o nosso servidor confirmando o pagamento. O app não decide se o pagamento foi aprovado — só o servidor decide, com base nessa notificação.

**Fotos dos produtos locais no app** — As imagens ficam dentro do próprio app (não carregadas da internet), então funcionam mesmo com a internet do food truck instável.

---

## O que ainda está sendo desenvolvido

- **Push Notifications** — Avisar o cliente quando o pedido estiver pronto para retirada
- **Cache offline** — Guardar o cardápio localmente para funcionar sem internet
- **Fotos de todos os produtos** — Apenas o X-Salada tem foto por enquanto; os demais mostram um placeholder colorido
- **Restrições de LGPD** — Endpoint para o cliente exportar ou apagar seus dados antes do lançamento público

---

## Equipe e contexto

Projeto Integrador do 5º semestre de Análise e Desenvolvimento de Sistemas — FATEC / SPTech.
Cliente real: food truck Portal do Churras, Pirituba — São Paulo.
