# 🚀 Ke Gestão - Blueprint Definitivo de Clonagem (v1.5.0)

Este documento é a especificação técnica, funcional e visual exaustiva do projeto **Ke Gestão**. Ele foi projetado para que uma inteligência artificial ou um engenheiro sênior consiga reconstruir o sistema do zero com fidelidade absoluta.

---

## 1. VISÃO GERAL DO PROJETO
- **Nome:** Ke Gestão.
- **Objetivo:** Sistema profissional de gestão de vendas, estoque e acompanhamento de clientes para consultoras independentes de cosméticos e perfumaria.
- **Problema Resolvido:** Centraliza o controle de dívidas parceladas, avisa sobre estoque baixo e organiza o fluxo de caixa futuro em uma interface mobile-first instalável.
- **Público-alvo:** Consultoras de beleza (Natura, Avon, Boticário, Mary Kay, etc.).
- **Contexto:** PWA (Progressive Web App) otimizado para iOS e Android, funcionando 100% offline.

---

## 2. ESCOPO FUNCIONAL

### Funcionalidades Principais:
1.  **Dashboard Inteligente:** Resumo financeiro, KPIs de vendas, alertas de estoque e lembretes de vencimento para o dia atual.
2.  **CRM de Clientes:** Cadastro, busca alfabética, filtragem por status de pagamento e integração direta com WhatsApp.
3.  **Controle de Estoque:** Catálogo categorizado com alertas automáticos de reposição e controle de preços.
4.  **Fluxo de Venda (Stepper):** Processo guiado em 3 passos (Cliente -> Produtos -> Pagamento/Parcelamento).
5.  **Gestão Financeira:** Acompanhamento detalhado de parcelas pendentes, vencidas e pagas, com carrossel de projeção de meses futuros.
6.  **Perfil do Usuário:** Customização de nome, branding do negócio e gerenciamento de instalação PWA.

---

## 3. REGRAS DE NEGÓCIO
- **Lógica de Status do Cliente:**
    - `Devedor`: Possui pelo menos uma parcela cujo `dueDate` < `hoje` e `paidAt` é nulo.
    - `Pendente`: Possui parcelas futuras (não pagas), mas nenhuma vencida.
    - `Em dia`: Todas as parcelas vinculadas estão pagas ou o cliente não tem vendas.
- **Máscara Inteligente "Auto-9":** Ao digitar 10 dígitos (DDD + 8 números), o sistema insere automaticamente o dígito '9' na terceira posição.
- **Abatimento de Estoque:** No ato da finalização da venda, o `stock` do produto é decrementado pela `quantity` vendida. O sistema bloqueia vendas acima do saldo atual.
- **Parcelamento:** Divide o valor total da venda igualmente pelo número de parcelas (1x a 12x), gerando datas de vencimento mensais consecutivas a partir da data da venda.

---

## 4. EXPERIÊNCIA DO USUÁRIO (UX/UI)
- **Tema "Boutique Premium":** Estética minimalista e luxuosa.
- **Design System:**
    - **Cores:** Primária `#f43f5e` (Rose-500). Secundárias em tons de Slate e Emerald.
    - **Tipografia:** Inter (Sans-serif) com pesos variados para hierarquia.
    - **Raio de Borda:** `rounded-2xl` (1rem) para botões e `rounded-3xl` (1.5rem) para cards.
- **Feedback Tátil:** Escala de `0.95` em todos os cliques de botões.
- **Estados:** Splash screen animada na inicialização; Modais de confirmação para exclusão; Redirecionamento automático após salvar perfil.

---

## 5. ARQUITETURA DO PROJETO
- **Arquitetura:** SPA (Single Page Application) estática, empacotada pelo Vite (ver a decisão de 30/10/2026 no fim deste documento).
- **Estrutura de Pastas (Flat/Root):**
    - `/`: Raiz contendo todos os arquivos principais para facilitar o deploy estático.
    - `/components`: Componentes atômicos e Layout.
    - `/views`: Telas completas da aplicação.
    - `/store`: Lógica de estado e persistência.
    - `/utils`: Formatadores e helpers.

### Árvore de Diretórios:
```text
/
├── index.html          # Ponto de entrada PWA e Config Tailwind
├── index.tsx           # Inicializador React
├── App.tsx             # Roteador de Views e Orquestrador
├── types.ts            # Interfaces TypeScript
├── constants.tsx       # Configurações globais e Nav
├── sw.js               # Service Worker (Cache & Offline)
├── manifest.json       # Manifesto PWA
├── /store
│   └── useStore.ts     # Hook Customizado (Estado & LocalStorage)
├── /components
│   ├── Layout.tsx      # Header, Nav e Container
│   ├── UI.tsx          # Botões, Cards, Inputs, Selects
│   ├── SplashScreen.tsx # Animação de entrada
│   └── CustomerSelector.tsx # Modal de busca de cliente na venda
├── /views
│   ├── Dashboard.tsx   # Painel Principal
│   ├── Customers.tsx   # Listagem CRM
│   ├── Inventory.tsx   # Gestão de Estoque
│   ├── NewSale.tsx     # Fluxo de Venda
│   ├── Debtors.tsx     # Financeiro / Recebíveis
│   ├── Profile.tsx     # Configurações
│   └── EditCustomer.tsx # Edição de Cliente
└── /utils
    └── format.ts       # Máscaras de Moeda, Data e Telefone
```

---

## 6. STACK TECNOLÓGICA
- **React 19:** UI reativa de última geração.
- **Tailwind CSS 3:** Estilização via classes utilitárias, compilada no build (`tailwind.config.js` + `index.css`).
- **Lucide React:** Iconografia consistente e leve.
- **Inter (variável, subconjunto latino):** fonte auto-hospedada via `@fontsource-variable/inter`.
- **LocalStorage API:** Banco de dados local persistente (offline-first).

---

## 7. ESTRUTURA DE DADOS (JSON)
O sistema utiliza um único objeto `AppData` no LocalStorage:
```typescript
{
  customers: [{ id, name, phone, createdAt }],
  products: [{ id, name, category, price, stock, minStock }],
  sales: [{ id, customerId, items: [{ productId, quantity, unitPrice }], total, paymentMethod, installments, createdAt }],
  installments: [{ id, saleId, number, amount, dueDate, paidAt? }],
  profile: { name, businessName, currency, theme }
}
```

---

## 8. COMO RECRIAR ESTE PROJETO DO ZERO

1.  **Prepare o build:** Vite + React 19 + Tailwind 3 (PostCSS) + `@fontsource-variable/inter`. O `index.html` não carrega nada de CDN; o CSS entra por `index.css`.
2.  **Defina os Tipos:** Crie o `types.ts` com as interfaces acima para garantir consistência em toda a aplicação.
3.  **Implemente a Store:** Crie o `useStore.ts`. Ele deve carregar o estado inicial do LocalStorage e expor métodos `add`, `update` e `delete` para todas as entidades, além de disparar o `localStorage.setItem` em cada mudança.
4.  **Crie a Biblioteca UI:** Implemente o `components/UI.tsx` com botões, cards e inputs estilizados com Tailwind.
5.  **Monte o Layout:** Desenvolva o `components/Layout.tsx` com o Header (título dinâmico) e a Bottom Navigation.
6.  **Desenvolva as Views na Ordem:**
    - Comece pela `Dashboard` para visualizar as estatísticas.
    - Crie `Customers` e `Inventory` para ter dados para testar.
    - Implemente o complexo `NewSale` (Stepper de 3 passos).
    - Finalize com `Debtors` e `Profile`.
7.  **PWA:** Adicione o `manifest.json` e o `sw.js` (pré-cache do build, cache-first; a lista é injetada por `precachePlugin` em `vite.config.ts`).
8.  **Finalização:** Adicione a `SplashScreen.tsx` no `App.tsx` com um timer de 2.5s.

---
**Nota de Sucesso:** A estética deve ser mantida com o uso intensivo de `rose-500` e fundos `slate-950` no modo escuro para preservar a identidade visual luxuosa.

---

## DECISÕES REGISTRADAS

### 30/10/2026 — Carregamento e offline de verdade (substitui "Tailwind/React por CDN" e "SW Stale-While-Revalidate")
- **Motivo:** com Tailwind (CDN), Google Fonts e importmap (esm.sh), o app dependia de 3 origens externas para a primeira pintura e, sem rede e sem o cache HTTP do navegador, abria **sem nenhum estilo**.
- **Agora:** Tailwind compilado no build, Inter auto-hospedada, nenhum recurso de terceiros. O service worker pré-cacheia tudo que o build emite (inclusive as views carregadas sob demanda) e responde cache-first.
- **Views sob demanda:** só o Dashboard está no pacote principal; as demais usam `React.lazy`.
- **Ícones:** `icon-192.png` e `icon-512.png` (o original de 352 kB ficou em `design/logo-original.png`, fora do que é publicado).
- **Medido (Slow-4G, CPU 4x, 390×844):** primeira pintura ~2,3 s → ~1,07 s; transferido 258 kB → 128 kB; origens externas 3 → 0.
