import { AppData, Customer, Installment, Product, Sale, UserProfile } from '../types';

export const defaultProfile = (): UserProfile => ({
  name: 'Consultora',
  businessName: 'Ke Gestão',
  currency: 'BRL'
});

export const emptyData = (): AppData => ({
  customers: [],
  products: [],
  sales: [],
  installments: [],
  profile: defaultProfile()
});

// O banco não garante ordem entre sessões: quem lê ordena, sempre com desempate por id.
const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export const byCreatedAt = (a: Customer | Product | Sale, b: Customer | Product | Sale) =>
  a.createdAt - b.createdAt || byId(a, b);

export const byDueDate = (a: Installment, b: Installment) =>
  a.dueDate - b.dueDate || a.number - b.number || byId(a, b);
