import { AppData, Customer, Installment, Product, Sale, SaleItem, UserProfile } from '../types';
import { defaultProfile } from '../core/data';
import { isThemeValue } from './theme';

// Chave do formato antigo: o app inteiro num JSON só, no localStorage.
export const LEGACY_KEY = 'kegestao_v1';

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const recs = (v: unknown): Rec[] => (Array.isArray(v) ? v.filter(isRec) : []);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const hasId = (r: Rec): boolean => typeof r.id === 'string' && r.id !== '';

const METHODS: Sale['paymentMethod'][] = ['pix', 'credit_card', 'debit_card', 'cash'];

// Lê o JSON antigo e devolve dados válidos; o que não tem id ou vem torto é descartado.
// Produtos antigos não tinham `createdAt`: ganham um em sequência, o que preserva a ordem em que estavam.
export const parseLegacy = (raw: string, now: number): AppData | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRec(parsed)) return null;

  const customers: Customer[] = recs(parsed.customers).filter(hasId).map(c => ({
    id: str(c.id), name: str(c.name), phone: str(c.phone), createdAt: num(c.createdAt, now)
  }));

  const products: Product[] = recs(parsed.products).filter(hasId).map((p, i) => ({
    id: str(p.id), name: str(p.name), category: str(p.category),
    price: num(p.price), stock: num(p.stock), minStock: num(p.minStock),
    createdAt: num(p.createdAt, now + i)
  }));

  const sales: Sale[] = recs(parsed.sales).filter(s => hasId(s) && typeof s.customerId === 'string').map(s => ({
    id: str(s.id),
    customerId: str(s.customerId),
    items: recs(s.items).map((it): SaleItem => ({
      productId: str(it.productId), quantity: num(it.quantity), unitPrice: num(it.unitPrice)
    })),
    total: num(s.total),
    paymentMethod: METHODS.includes(s.paymentMethod as Sale['paymentMethod'])
      ? (s.paymentMethod as Sale['paymentMethod'])
      : 'pix',
    installments: Math.max(1, Math.trunc(num(s.installments, 1))),
    createdAt: num(s.createdAt, now)
  }));

  const installments: Installment[] = recs(parsed.installments)
    .filter(i => hasId(i) && typeof i.saleId === 'string')
    .map(i => ({
      id: str(i.id), saleId: str(i.saleId), number: num(i.number, 1),
      amount: num(i.amount), dueDate: num(i.dueDate, now),
      ...(typeof i.paidAt === 'number' ? { paidAt: i.paidAt } : {})
    }));

  const p = isRec(parsed.profile) ? parsed.profile : {};
  const base = defaultProfile();
  const profile: UserProfile = {
    name: str(p.name, base.name),
    businessName: str(p.businessName, base.businessName),
    currency: str(p.currency, base.currency),
    ...(isThemeValue(p.theme) ? { theme: p.theme } : {})
  };

  return { customers, products, sales, installments, profile };
};
