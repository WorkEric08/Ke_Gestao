import { CustomerStatus, Installment, Sale } from '../types';
import { fromCents, splitCents, toCents } from './money';
import { addMonths, startOfDay } from './time';

// Vencida = antes de hoje (início do dia). Uma parcela que vence hoje ainda não está vencida,
// em qualquer hora do dia. Esta é a única regra: status do cliente, Financeiro e lembretes usam ela.
export const isOverdue = (dueDate: number, now: number): boolean => dueDate < startOfDay(now);

export const isDueToday = (dueDate: number, now: number): boolean =>
  startOfDay(dueDate) === startOfDay(now);

// `newId` vem de fora: o núcleo não gera id nem lê o relógio.
export const buildInstallments = (
  sale: Pick<Sale, 'id' | 'total' | 'installments' | 'createdAt'>,
  newId: () => string
): Installment[] =>
  splitCents(toCents(sale.total), sale.installments).map((cents, i) => ({
    id: newId(),
    saleId: sale.id,
    number: i + 1,
    amount: fromCents(cents),
    dueDate: addMonths(sale.createdAt, i + 1)
  }));

// Quem tem parcela vencida em aberto é devedor; senão, quem tem parcela futura em aberto é pendente.
export const customerStatuses = (
  installments: Installment[],
  sales: Sale[],
  now: number
): Map<string, CustomerStatus> => {
  const customerOfSale = new Map<string, string>();
  for (const sale of sales) customerOfSale.set(sale.id, sale.customerId);

  const statuses = new Map<string, CustomerStatus>();
  for (const ins of installments) {
    if (ins.paidAt) continue;
    const customerId = customerOfSale.get(ins.saleId);
    if (!customerId) continue;
    if (isOverdue(ins.dueDate, now)) statuses.set(customerId, 'devedor');
    else if (statuses.get(customerId) !== 'devedor') statuses.set(customerId, 'pendente');
  }
  return statuses;
};
