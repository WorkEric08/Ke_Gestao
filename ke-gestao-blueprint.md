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
- **Visual:** Material 3 (Android), claro e escuro, minimalista (ver a decisão de 30/10/2026 no fim).
- **Design System:**
    - **Cores:** papéis do Material 3 gerados a partir de `#F43F5E`; no escuro, superfície preta.
    - **Tipografia:** Roboto, escala do Material 3.
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
- **Roboto (variável, subconjunto latino):** fonte auto-hospedada via `@fontsource-variable/roboto`.
- **IndexedDB via Dexie 4:** banco local no aparelho (offline-first). `localStorage` só guarda o espelho do tema e o JSON do formato antigo, até migrar.
- **Vitest + fake-indexeddb:** testes do núcleo (`core/`) e dos serviços (`services/`); `npm test`.

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

1.  **Prepare o build:** Vite + React 19 + Tailwind 3 (PostCSS) + `@fontsource-variable/roboto`. O `index.html` não carrega nada de CDN; o CSS entra por `index.css`.
2.  **Defina os Tipos:** Crie o `types.ts` com as interfaces acima para garantir consistência em toda a aplicação.
3.  **Implemente o núcleo e a Store:** as regras (parcelas no centavo, vencida, status do cliente, estoque, estatísticas) ficam em `core/`, TypeScript puro e testado. O `useStore.ts` só mantém o estado em memória, chama o núcleo e grava cada mudança pelo repositório (`services/repository.ts`, Dexie) em uma transação.
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
**Nota:** use os papéis de cor (`bg-surface`, `text-on-surface`…) em tela nova; `rose-*`/`slate-*` só nas telas ainda não migradas.

---

## DECISÕES REGISTRADAS

### 30/10/2026 — Carregamento e offline de verdade (substitui "Tailwind/React por CDN" e "SW Stale-While-Revalidate")
- **Motivo:** com Tailwind (CDN), Google Fonts e importmap (esm.sh), o app dependia de 3 origens externas para a primeira pintura e, sem rede e sem o cache HTTP do navegador, abria **sem nenhum estilo**.
- **Agora:** Tailwind compilado no build, Roboto auto-hospedada, nenhum recurso de terceiros. O service worker pré-cacheia tudo que o build emite (inclusive as views carregadas sob demanda) e responde cache-first.
- **Views sob demanda:** só o Dashboard está no pacote principal; as demais usam `React.lazy`.
- **Ícones:** `icon-192.png` e `icon-512.png` (o original de 352 kB ficou em `design/logo-original.png`, fora do que é publicado).
- **Medido (Slow-4G, CPU 4x, 390×844):** primeira pintura ~2,3 s → ~1,07 s; transferido 258 kB → 128 kB; origens externas 3 → 0.

### 30/10/2026 — Dados em IndexedDB e regras no núcleo (substitui "LocalStorage como banco")
- **Motivo:** o app regravava o JSON inteiro no `localStorage` (síncrono, ~5 MB) a cada mudança, e as contas de dinheiro e de data viviam dentro do store, sem teste.
- **Agora:** `core/` (puro) + `services/` (Dexie) + `store/`. O JSON antigo migra sozinho na primeira abertura e só é apagado depois de reler o banco e conferir que tudo entrou. O banco sempre vence.
- **Regras corrigidas ao extrair:**
  - Parcelas somam exatamente o total (a sobra de centavos vai às primeiras parcelas).
  - Vencimentos mensais não pulam o mês (31/01 + 1 mês = 28/02).
  - "Vencida" é uma regra só (antes de hoje), usada por status do cliente, Financeiro e lembretes, e recalcula quando o dia vira.
  - O total da venda sai dos itens, no centavo.
- **Custo assumido:** Dexie soma ≈ +35 kB gzip ao JS principal.

### 30/10/2026 — Visual Material 3 (Android), claro e escuro (substitui "Boutique Premium", Inter e o rosa #f43f5e direto nas classes)
- **Referência:** o mockup aprovado (Início, Estoque, Perfil e a folha do sistema), seguindo o Material 3 do Android.
- **Cor:** papéis do Material 3 a partir de #F43F5E, em `index.css` (`:root` e `.dark`) e expostos no Tailwind (`bg-surface`, `text-on-surface-variant`, `bg-primary-container`…). No escuro a superfície é **preto puro** e a navegação inferior também.
- **Navegação:** barra inferior de 80 dp com indicador em pílula 64×32 (`Layout.tsx`); barra superior de 64 dp, com avatar/saudação só no Início.
- **Telas no mockup:** Início, Estoque e Perfil seguem as medidas do mockup (80 conferências em 412×892, nos dois modos). O Perfil agora salva ao sair do campo (sem botão "Salvar").
- **Telas fora do mockup** (Clientes, Financeiro, Nova venda, Editar cliente, seletor de cliente, Informações do sistema): ainda usam `slate`/`gray`/`rose`; no `tailwind.config.js` essas escalas apontam para os tons do Material 3 (paleta de transição). Migrar uma tela = trocar essas classes pelos papéis de cor.
- **Fonte:** Roboto (era Inter).

### 30/10/2026 — Splash do batom e ícone novo
- **Splash:** 2 s, SVG/CSS inline no `index.html` (aparece antes do bundle), guiada pelo relógio (`performance.now`). Ajustes em `CFG` (tempos, fade, timeout) e nos `fill` do SVG (cores).
- **Abertura:** `services/startup.ts` dispara banco, fonte e telas em paralelo e libera o splash quando animação e app estiverem prontos (timeout de segurança de 6 s). Em dev, o console mostra o tempo de abertura (meta 1,8 s). Em produção, as marcas `ke:*` e `splash:*` ficam em `performance.getEntriesByType('mark')`.
- **Build:** o HTML pré-carrega a fonte e os pedaços das telas (`startupPreloadPlugin` em `vite.config.ts`).
- **Teste:** a chave `localStorage['ke:sem-splash'] = '1'` desliga o splash (senão ele intercepta o toque dos testes de tela).
- **Ícone:** `design/icone_batom.png` é a origem; `public/` tem icon-192, icon-512, icon-maskable-512 (full-bleed), apple-touch-icon e favicon-32.

### 30/10/2026 — Empacotamento em APK (Capacitor)
- **Como:** Capacitor 8 (`capacitor.config.ts`, `appId com.kegestao.app` — **nunca mudar**). `npm run apk:debug` / `apk:release` geram o APK em `release/`. Detalhes e comandos no `README.md`.
- **Um `dist/`, dois destinos:** `build:android` liga `VITE_ANDROID=1` (decisão de build) e **não leva service worker nem `version.json`**: o app já está em disco.
- **Nativo em `services/native/`** (com fallback web): botão voltar do Android (`core/navigation.ts` decide o destino; na tela inicial fecha o app) e cor da janela/barras por tema (plugin local `WindowColors`).
- **Só do PWA, escondido no APK:** cartão "Instalar no dispositivo" e a checagem de atualização do "Informações do sistema".
- **Otimização do release:** R8 (`minifyEnabled`) + `shrinkResources`, só os idiomas en/pt-BR, imagens de splash do template removidas, abertura nativa preta sem ícone.
- **`android/` não é versionado:** tudo que é nosso está em `native/android/` e `scripts/android-patch.mjs` (idempotente). A chave de assinatura fica em `~/.kegestao/`, fora do projeto.
