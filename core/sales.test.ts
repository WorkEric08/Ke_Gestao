import { describe, expect, it } from 'vitest';
import { Installment, Product, Sale } from '../types';
import { cascadeOfCustomer, deductStock, saleTotal } from './sales';

const product = (id: string, stock: number): Product => ({
  id, name: id, category: 'x', price: 10, stock, minStock: 2, createdAt: 1
});

describe('saleTotal', () => {
  it('soma no centavo (0,10 x 3 = 0,30 e não 0,30000000000000004)', () => {
    expect(saleTotal([{ productId: 'a', quantity: 3, unitPrice: 0.1 }])).toBe(0.3);
  });

  it('soma várias linhas', () => {
    expect(saleTotal([
      { productId: 'a', quantity: 2, unitPrice: 19.9 },
      { productId: 'b', quantity: 1, unitPrice: 33.4 }
    ])).toBe(73.2);
    expect(saleTotal([])).toBe(0);
  });
});

describe('deductStock', () => {
  it('devolve só o que mudou e não altera a entrada', () => {
    const products = [product('a', 5), product('b', 5)];
    const changed = deductStock(products, [{ productId: 'a', quantity: 2, unitPrice: 1 }]);
    expect(changed).toEqual([{ ...products[0], stock: 3 }]);
    expect(products[0].stock).toBe(5);
    expect(changed[0]).not.toBe(products[0]);
  });

  it('nunca deixa o estoque negativo', () => {
    const [p] = deductStock([product('a', 1)], [{ productId: 'a', quantity: 5, unitPrice: 1 }]);
    expect(p.stock).toBe(0);
  });

  it('soma o mesmo produto em duas linhas', () => {
    const [p] = deductStock([product('a', 10)], [
      { productId: 'a', quantity: 2, unitPrice: 1 },
      { productId: 'a', quantity: 3, unitPrice: 1 }
    ]);
    expect(p.stock).toBe(5);
  });

  it('ignora produto que não existe', () => {
    expect(deductStock([product('a', 5)], [{ productId: 'zzz', quantity: 1, unitPrice: 1 }])).toEqual([]);
  });
});

describe('cascadeOfCustomer', () => {
  const sale = (id: string, customerId: string): Sale => ({
    id, customerId, items: [], total: 1, paymentMethod: 'pix', installments: 1, createdAt: 1
  });
  const ins = (id: string, saleId: string): Installment => ({ id, saleId, number: 1, amount: 1, dueDate: 1 });

  it('leva as vendas do cliente e as parcelas delas, e só elas', () => {
    const r = cascadeOfCustomer(
      [sale('s1', 'ana'), sale('s2', 'bia')],
      [ins('i1', 's1'), ins('i2', 's1'), ins('i3', 's2')],
      'ana'
    );
    expect(r).toEqual({ saleIds: ['s1'], installmentIds: ['i1', 'i2'] });
  });
});
