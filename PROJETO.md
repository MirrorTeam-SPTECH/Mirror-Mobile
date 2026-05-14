# Portal do Churras

> Super-app para um food truck de hambúrguer artesanal.
> Projeto integrador universitário — time pequeno, cliente real.

---

## Fala de apresentação — Frontend

> *Use como roteiro. As indicações entre colchetes [ ] são lembretes do que mostrar na tela — não precisa ler em voz alta.*

---

### Abertura

"Bom dia / Boa tarde a todos. Eu vou apresentar o frontend do nosso projeto, o **Portal do Churras** — um super-app para um food truck de hambúrguer artesanal aqui em São Paulo, em Pirituba. O diferencial desse projeto é que ele tem um cliente real, então as decisões que tomamos ao longo do semestre foram baseadas em necessidades reais de negócio."

"A proposta do app é cobrir toda a experiência do cliente — desde conhecer o cardápio até retirar o pedido — com algumas features extras que vou mostrar agora."

---

### Onboarding

*[ Abrir o app pela primeira vez — tela de onboarding ]*

"Quando o cliente abre o app pela primeira vez, ele vê essa tela de apresentação. São três slides que apresentam o conceito do food truck de forma rápida. O cliente pode avançar pelo ritmo dele ou pular direto pro app. Depois que ele passa uma vez, não aparece mais — guardamos essa informação localmente no celular."

---

### Login e Cadastro

*[ Avançar para a tela de login ]*

"Aqui é a tela de login. O cliente entra com e-mail e senha. Se for a primeira vez, se cadastra na mesma tela. O sistema usa autenticação com token JWT — que é basicamente um certificado digital temporário — e esse token fica salvo no celular. Então se o cliente fechar e abrir o app de novo, ele já entra direto, sem precisar fazer login de novo."

---

### Home — Cardápio

*[ Logar e mostrar a HomeScreen ]*

"Aqui é a tela principal. O cardápio está dividido por categorias — Hambúrgueres, Bebidas, Acompanhamentos, Sobremesas, Combos. O cliente filtra pelo que quiser aqui em cima. Cada card mostra o nome, a descrição, o preço e o tempo de preparo. Tem também o botão de favoritar."

*[ Mostrar os cards, talvez rolar um pouco ]*

"A imagem que aparece no card é uma foto real do produto. Para os produtos que ainda não têm foto cadastrada, o app exibe um placeholder colorido — diferente por produto — pra não deixar aquele quadrado branco feio."

---

### Detalhe do Produto

*[ Clicar em um produto ]*

"Quando o cliente toca num produto, abre essa tela de detalhe. Aqui ele vê a descrição completa e as opções de personalização — por exemplo, tipo de queijo, se quer adicionar bacon, esse tipo de coisa. Essas opções foram configuradas pelo próprio dono do food truck, não é livre — é igual ao iFood, onde o cardápio define o que pode ser customizado."

*[ Selecionar uma opção e adicionar ao carrinho ]*

"Escolheu, adicionou ao carrinho."

---

### Carrinho e Checkout

*[ Abrir o carrinho ]*

"No carrinho, o cliente vê tudo que adicionou, pode ajustar a quantidade ou remover algum item. Aqui embaixo aparece o subtotal e o total."

*[ Clicar em Finalizar Pedido ]*

"Quando ele clica em Finalizar Pedido, o sistema registra o pedido lá no backend — e aí o [colega do backend] vai explicar o que acontece nesse momento — e abre a tela de pagamento do Mercado Pago para o cliente pagar."

---

### Acompanhar Pedido

*[ Voltar pro app após o pagamento — ou navegar para a tela de acompanhamento ]*

"Depois de pagar, o cliente cai nessa tela de acompanhamento. O status atualiza automaticamente a cada 5 segundos — sem o cliente precisar ficar apertando refresh. Quando o pedido fica pronto, aparece esse código aqui — o código de retirada. O cliente mostra esse código no balcão e retira o lanche."

"Os status seguem uma máquina de estados: aguardando pagamento, pago, em preparo, pronto pra retirada, entregue. Cada transição é controlada pelo backend."

---

### Fidelidade

*[ Navegar para a aba de Fidelidade ]*

"Essa é uma das features que o próprio dono pediu. O cartão de fidelidade. A cada pedido que tem pelo menos um hambúrguer, o cliente ganha um selo — essa bolinha aqui fica vermelha. Com 10 selos, ele ganha um combo grátis."

"Uma detalhe importante: só pedido com hambúrguer conta. Se o cliente pedir só uma bebida ou uma batata, não avança. Essa regra foi definida com o cliente do projeto."

*[ Mostrar as bolinhas preenchidas se houver ]*

---

### Perto de Você

*[ Navegar para Perto de Você via tela de Perfil ]*

"Essa feature usa a localização em tempo real do celular. O app calcula a distância até o food truck e avisa quando o cliente está a menos de 300 metros. Se ele já tiver histórico de pedidos, o app sugere o lanche que ele mais pede — tipo um 'tá chegando, já manda o de sempre?'."

"O endereço do food truck também aparece sempre na tela, pra facilitar."

---

### Churrasqueiro de Bolso

*[ Navegar para Churrasqueiro de Bolso via Perfil ]*

"Essa é uma das features com inteligência artificial. O cliente tira uma foto da carne na churrasqueira e o app analisa o ponto — se está mal passado, ao ponto, bem passado — e dá uma dica de preparo. Isso usa a API de visão do Claude, que é o modelo de IA da Anthropic. A foto vai pro nosso servidor, o servidor manda pro Claude, e o Claude devolve a análise."

*[ Mostrar a tela, se possível tirar uma foto ou mostrar um resultado já pronto ]*

---

### Scanner Comparativo

*[ Navegar para Scanner Comparativo via Perfil ]*

"No Scanner Comparativo, o cliente aponta a câmera pra um lanche de outro lugar — pode ser um rótulo, uma embalagem, o que for. O app lê as informações e sugere qual produto do Portal do Churras seria o equivalente ou o melhor substituto. É uma forma bem criativa de mostrar o produto do cliente."

---

### Favoritos e Perfil

*[ Abrir a aba de Favoritos ]*

"Os produtos curtidos ficam salvos aqui nos Favoritos, sincronizados com a conta do cliente. Funciona de qualquer aparelho."

*[ Mostrar a tela de Perfil ]*

"E aqui no Perfil, o cliente acessa o histórico de pedidos, todas as features que mostrei, e pode sair da conta."

---

### Fechamento — gancho pro backend

"Isso foi tudo que construímos no frontend. Uma coisa importante é que o app é só a ponta do iceberg — tudo que mostrei aqui depende de uma série de decisões e processamentos que acontecem no servidor. O pagamento, o registro do pedido, a fidelidade, a integração com a IA — tudo isso é responsabilidade do backend. Então eu passo a palavra pro [nome do colega] que vai explicar como o servidor foi estruturado e o que acontece por trás de cada uma dessas ações."

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

Projeto Integrador do 5º semestre de Análise e Desenvolvimento de Sistemas — SPTech.
Cliente real: food truck Portal do Churras, Pirituba — São Paulo.
