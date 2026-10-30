import { Installment, Product, Sale, SaleItem } from '../types';
import { fromCents, toCents } from './money';

export const saleTotal = (items: SaleItem[]): number =>
  fromCents(items.reduce((sum, it) => sum + toCents(it.unitPrice) * it.quantity, 0));

// Devolve só os produtos cujo estoque mudou (cópias novas; a entrada não é alterada).
// O estoque nunca fica negativo e o mesmo produto em duas linhas soma as quantidades.
export const deductStock = (products: Product[], items: SaleItem[]): Product[] => {
  const sold = new Map<string, number>();
  for (const it of items) sold.set(it.productId, (sold.get(it.productId) ?? 0) + it.quantity);

  const changed: Product[] = [];
  for (const p of products) {
    const qty = sold.get(p.id);
    if (!qty) continue;
    const stock = Math.max(0, p.stock - qty);
    if (stock !== p.stock) changed.push({ ...p, stock });
  }
  return changed;
};

// Tudo que depende de um cliente: apagar o cliente leva as vendas e as parcelas delas.
export const cascadeOfCustomer = (
  sales: Sale[],
  installments: Installment[],
  customerId: string
): { saleIds: string[]; installmentIds: string[] } => {
  const saleIds = sales.filter(s => s.customerId === customerId).map(s => s.id);
  const gone = new Set(saleIds);
  const installmentIds = installments.filter(i => gone.has(i.saleId)).map(i => i.id);
  return { saleIds, installmentIds };
};
