import { AppData } from '../types';
import { isDueToday } from './finance';
import { monthKey, startOfDay } from './time';

export interface Reminder {
  id: string;
  customerName: string;
  amount: number;
  installmentNumber: number;
  installmentCount: number;
}

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// '2026-09' -> 'SET/26'. Texto fixo (sem Intl): o rótulo não muda com o navegador.
export const monthLabel = (key: string): string => `${MONTHS[Number(key.slice(5, 7)) - 1]}/${key.slice(2, 4)}`;

export const dashboardStats = (
  data: Pick<AppData, 'sales' | 'installments' | 'products' | 'customers'>,
  now: number
) => {
  const today = startOfDay(now);
  const nowDate = new Date(now);
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();

  let salesToday = 0;
  let salesMonth = 0;
  for (const s of data.sales) {
    if (s.createdAt >= today) salesToday += s.total;
    if (s.createdAt >= monthStart) salesMonth += s.total;
  }

  let totalReceivable = 0;
  let furthestInstallment: number | null = null;
  const monthly = new Map<string, number>();
  for (const ins of data.installments) {
    if (ins.paidAt) continue;
    totalReceivable += ins.amount;
    const key = monthKey(ins.dueDate);
    monthly.set(key, (monthly.get(key) ?? 0) + ins.amount);
    if (furthestInstallment === null || ins.dueDate > furthestInstallment) furthestInstallment = ins.dueDate;
  }

  const currentKey = monthKey(now);
  const keys = [...monthly.keys()].sort();
  let receivableFuture = 0;
  for (const key of keys) if (key > currentKey) receivableFuture += monthly.get(key)!;

  const receivablesByMonth = keys.map(key => ({
    key,
    label: monthLabel(key),
    total: monthly.get(key)!,
    isCurrent: key === currentKey
  }));

  let lowStockItems = 0;
  for (const p of data.products) if (p.stock <= p.minStock) lowStockItems += 1;

  return {
    salesToday,
    salesMonth,
    totalReceivable,
    receivableThisMonth: monthly.get(currentKey) ?? 0,
    receivableFuture,
    receivablesByMonth,
    furthestInstallment,
    activeCustomers: data.customers.length,
    lowStockItems
  };
};

export const todayReminders = (
  data: Pick<AppData, 'sales' | 'installments' | 'customers'>,
  now: number
): Reminder[] => {
  const customerName = new Map(data.customers.map(c => [c.id, c.name]));
  const saleById = new Map(data.sales.map(s => [s.id, s]));
  return data.installments
    .filter(ins => !ins.paidAt && isDueToday(ins.dueDate, now))
    .map(ins => {
      const sale = saleById.get(ins.saleId);
      return {
        id: ins.id,
        customerName: customerName.get(sale?.customerId ?? '') ?? 'Cliente',
        amount: ins.amount,
        installmentNumber: ins.number,
        installmentCount: sale?.installments ?? ins.number
      };
    });
};
