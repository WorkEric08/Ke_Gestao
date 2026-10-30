import { describe, expect, it } from 'vitest';
import { Customer, Installment, Product, Sale } from '../types';
import { dashboardStats, monthLabel, todayReminders } from './stats';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 6, 15, 15);

const customers: Customer[] = [{ id: 'ana', name: 'Ana', phone: '1', createdAt: 1 }];
const sale = (id: string, total: number, createdAt: number): Sale => ({
  id, customerId: 'ana', items: [], total, paymentMethod: 'pix', installments: 1, createdAt
});
const ins = (id: string, saleId: string, amount: number, dueDate: number, paidAt?: number): Installment => ({
  id, saleId, number: 1, amount, dueDate, ...(paidAt ? { paidAt } : {})
});
const product = (id: string, stock: number, minStock: number): Product => ({
  id, name: id, category: 'x', price: 1, stock, minStock, createdAt: 1
});

describe('dashboardStats', () => {
  const data = {
    customers,
    sales: [sale('a', 100, at(2026, 6, 15, 9)), sale('b', 50, at(2026, 6, 2)), sale('c', 30, at(2026, 5, 20))],
    installments: [
      ins('1', 'a', 10, at(2026, 6, 20)),
      ins('2', 'a', 20, at(2026, 7, 20)),
      ins('3', 'a', 5, at(2026, 8, 20)),
      ins('4', 'a', 99, at(2026, 6, 1), at(2026, 6, 1))
    ],
    products: [product('p1', 1, 2), product('p2', 9, 2), product('p3', 2, 2)]
  };
  const stats = dashboardStats(data, NOW);

  it('vendas de hoje e do mês', () => {
    expect(stats.salesToday).toBe(100);
    expect(stats.salesMonth).toBe(150);
  });

  it('recebíveis ignoram parcela paga e separam este mês do futuro', () => {
    expect(stats.totalReceivable).toBe(35);
    expect(stats.receivableThisMonth).toBe(10);
    expect(stats.receivableFuture).toBe(25);
    expect(stats.furthestInstallment).toBe(at(2026, 8, 20));
  });

  it('cronograma em ordem, com o mês atual marcado', () => {
    expect(stats.receivablesByMonth.map(m => [m.key, m.total, m.isCurrent])).toEqual([
      ['2026-06', 10, true], ['2026-07', 20, false], ['2026-08', 5, false]
    ]);
  });

  it('estoque baixo é <= mínimo; clientes são contados', () => {
    expect(stats.lowStockItems).toBe(2);
    expect(stats.activeCustomers).toBe(1);
  });

  it('sem dados: tudo zerado', () => {
    const empty = dashboardStats({ customers: [], sales: [], installments: [], products: [] }, NOW);
    expect(empty.totalReceivable).toBe(0);
    expect(empty.furthestInstallment).toBeNull();
    expect(empty.receivablesByMonth).toEqual([]);
  });
});

describe('monthLabel', () => {
  it('mês em maiúsculas e ano com dois dígitos', () => {
    expect(monthLabel('2026-09')).toBe('SET/26');
    expect(monthLabel('2027-02')).toBe('FEV/27');
    expect(monthLabel('2026-12')).toBe('DEZ/26');
  });

  it('o cronograma usa esse rótulo', () => {
    const stats = dashboardStats({
      customers: [], products: [], sales: [],
      installments: [{ id: 'i', saleId: 's', number: 1, amount: 5, dueDate: new Date(2026, 8, 10).getTime() }]
    }, NOW);
    expect(stats.receivablesByMonth[0].label).toBe('SET/26');
  });
});

describe('todayReminders', () => {
  const sales = [{ ...sale('a', 1, 1), installments: 3 }];

  it('só parcelas em aberto que vencem hoje, com o nome do cliente', () => {
    const list = todayReminders({
      customers, sales,
      installments: [
        ins('hoje', 'a', 10, at(2026, 6, 15, 8)),
        ins('paga', 'a', 10, at(2026, 6, 15, 8), 1),
        ins('amanha', 'a', 10, at(2026, 6, 16, 8))
      ]
    }, NOW);
    expect(list).toEqual([{ id: 'hoje', customerName: 'Ana', amount: 10, installmentNumber: 1, installmentCount: 3 }]);
  });

  it('cliente apagado vira "Cliente"', () => {
    const list = todayReminders({ customers: [], sales, installments: [ins('x', 'a', 5, NOW)] }, NOW);
    expect(list[0].customerName).toBe('Cliente');
  });
});
