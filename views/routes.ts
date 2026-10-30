// Um loader por tela carregada sob demanda. O App usa estes mesmos loaders no `lazy`, e o boot os
// dispara de uma vez (prefetch): quando o splash sai, nenhuma troca de tela espera rede.
export const routes = {
  customers: () => import('./Customers'),
  editCustomer: () => import('./EditCustomer'),
  inventory: () => import('./Inventory'),
  newSale: () => import('./NewSale'),
  debtors: () => import('./Debtors'),
  profile: () => import('./Profile')
};

// Uma tela que falha ao carregar não pode segurar a abertura do app: ela tenta de novo quando for aberta.
export const prefetchRoutes = (): Promise<unknown> =>
  Promise.allSettled(Object.values(routes).map((load) => load()));
