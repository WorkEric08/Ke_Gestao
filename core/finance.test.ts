import { describe, expect, it } from 'vitest';
import { Installment, Sale } from '../types';
import { buildInstallments, customerStatuses, isDueToday, isOverdue } from './finance';
import { toCents } from './money';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const NOW = at(2026, 6, 15, 15);

const sale = (id: string, customerId: string): Sale => ({
  id, customerId, items: [], total: 100, paymentMethod: 'pix', installments: 1, createdAt: at(2026, 1, 1)
});
const ins = (id: string, saleId: string, dueDate: number, paidAt?: number): Installment => ({
  id, saleId, number: 1, amount: 10, dueDate, ...(paidAt ? { paidAt } : {})
});

describe('isOverdue / isDueToday', () => {
  it('vence hoje não é vencida, mesmo com a hora já passada', () => {
    expect(isOverdue(at(2026, 6, 15, 8), NOW)).toBe(false);
    expect(isDueToday(at(2026, 6, 15, 8), NOW)).toBe(true);
  });

  it('ontem é vencida; amanhã é pendente', () => {
    expect(isOverdue(at(2026, 6, 14, 23), NOW)).toBe(true);
    expect(isOverdue(at(2026, 6, 16, 0), NOW)).toBe(false);
    expect(isDueToday(at(2026, 6, 16, 0), NOW)).toBe(false);
  });
});

describe('buildInstallments', () => {
  const ids = () => { let n = 0; return () => `i${++n}`; };

  it('divide no centavo e põe a sobra na primeira parcela', () => {
    const list = buildInstallments({ id: 's', total: 100, installments: 3, createdAt: at(2026, 1, 31) }, ids());
    expect(list.map(i => i.amount)).toEqual([33.34, 33.33, 33.33]);
    expect(list.map(i => i.number)).toEqual([1, 2, 3]);
    expect(list.every(i => i.saleId === 's')).toBe(true);
  });

  it('vence todo mês a partir da venda, sem pular fevereiro', () => {
    const list = buildInstallments({ id: 's', total: 90, installments: 3, createdAt: at(2026, 1, 31) }, ids());
    expect(list.map(i => new Date(i.dueDate).getMonth() + 1)).toEqual([2, 3, 4]);
  });

  it('propriedade: as parcelas somam exatamente o total da venda', () => {
    let seed = 99;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let i = 0; i < 3000; i++) {
      const total = Math.floor(rand() * 2_000_000) / 100;
      const n = 1 + Math.floor(rand() * 12);
      const list = buildInstallments({ id: 's', total, installments: n, createdAt: at(2026, 1, 1 + Math.floor(rand() * 28)) }, ids());
      expect(list.reduce((sum, p) => sum + toCents(p.amount), 0)).toBe(toCents(total));
      expect(list).toHaveLength(n);
      for (let k = 1; k < n; k++) expect(list[k].dueDate).toBeGreaterThan(list[k - 1].dueDate);
    }
  });
});

describe('customerStatuses', () => {
  const sales = [sale('s1', 'ana'), sale('s2', 'bia'), sale('s3', 'cris')];

  it('devedor tem parcela vencida em aberto; pendente só tem parcelas futuras', () => {
    const map = customerStatuses(
      [ins('a', 's1', at(2026, 6, 1)), ins('b', 's2', at(2026, 7, 1))],
      sales,
      NOW
    );
    expect(map.get('ana')).toBe('devedor');
    expect(map.get('bia')).toBe('pendente');
    expect(map.get('cris')).toBeUndefined();
  });

  it('devedor vence pendente, em qualquer ordem das parcelas', () => {
    const a = ins('a', 's1', at(2026, 7, 1));
    const b = ins('b', 's1', at(2026, 6, 1));
    expect(customerStatuses([a, b], sales, NOW).get('ana')).toBe('devedor');
    expect(customerStatuses([b, a], sales, NOW).get('ana')).toBe('devedor');
  });

  it('parcela paga não conta, e a que vence hoje é só pendente', () => {
    const map = customerStatuses(
      [ins('a', 's1', at(2026, 6, 1), NOW), ins('b', 's2', at(2026, 6, 15, 8))],
      sales,
      NOW
    );
    expect(map.has('ana')).toBe(false);
    expect(map.get('bia')).toBe('pendente');
  });

  it('o status muda sozinho quando o dia vira, sem o dado mudar', () => {
    const list = [ins('a', 's1', at(2026, 6, 15, 8))];
    expect(customerStatuses(list, sales, NOW).get('ana')).toBe('pendente');
    expect(customerStatuses(list, sales, at(2026, 6, 16, 0)).get('ana')).toBe('devedor');
  });

  it('ignora parcela de venda que não existe mais', () => {
    expect(customerStatuses([ins('a', 'orfa', at(2026, 1, 1))], sales, NOW).size).toBe(0);
  });
});
