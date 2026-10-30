import { describe, expect, it } from 'vitest';
import { parseLegacy } from './legacy';
import { resolveTheme } from './theme';

describe('parseLegacy', () => {
  it('recusa o que não é JSON de objeto', () => {
    expect(parseLegacy('nope', 1)).toBeNull();
    expect(parseLegacy('[]', 1)).toBeNull();
    expect(parseLegacy('null', 1)).toBeNull();
  });

  it('um objeto vazio vira dados vazios com o perfil padrão', () => {
    const d = parseLegacy('{}', 1)!;
    expect(d.customers).toEqual([]);
    expect(d.profile).toEqual({ name: 'Consultora', businessName: 'Ke Gestão', currency: 'BRL' });
  });

  it('descarta registros sem id e valores tortos, sem derrubar o resto', () => {
    const d = parseLegacy(JSON.stringify({
      customers: [{ id: 'a', name: 'Ok', phone: '1' }, { name: 'sem id' }, 'lixo', null],
      products: [{ id: 'p', name: 'P', price: 'dez', stock: NaN, minStock: 2 }],
      sales: [{ id: 's', customerId: 'a', items: [{ productId: 'p', quantity: 2, unitPrice: 5 }, 7], total: 10, paymentMethod: 'boleto', installments: 0 }, { id: 'sem cliente' }],
      installments: [{ id: 'i', saleId: 's', number: 1, amount: 10, dueDate: 5 }, { id: 'sem venda' }]
    }), 50)!;
    expect(d.customers.map(c => c.id)).toEqual(['a']);
    expect(d.customers[0].createdAt).toBe(50);
    expect(d.products[0]).toMatchObject({ price: 0, stock: 0, minStock: 2 });
    expect(d.sales).toHaveLength(1);
    expect(d.sales[0]).toMatchObject({ paymentMethod: 'pix', installments: 1 });
    expect(d.sales[0].items).toHaveLength(1);
    expect(d.installments.map(i => i.id)).toEqual(['i']);
  });

  it('mantém paidAt só quando é número', () => {
    const d = parseLegacy(JSON.stringify({
      installments: [{ id: 'a', saleId: 's', paidAt: 9 }, { id: 'b', saleId: 's', paidAt: 'ontem' }]
    }), 1)!;
    expect(d.installments[0].paidAt).toBe(9);
    expect('paidAt' in d.installments[1]).toBe(false);
  });
});

describe('resolveTheme', () => {
  const storage = (init: Record<string, string>) => ({ getItem: (k: string) => init[k] ?? null });

  it('sem escolha manual, segue o sistema', () => {
    expect(resolveTheme(storage({}), true)).toBe('dark');
    expect(resolveTheme(storage({}), false)).toBe('light');
    expect(resolveTheme(storage({ kegestao_theme: 'dark' }), false)).toBe('light');
  });

  it('com escolha manual, vale o espelho', () => {
    expect(resolveTheme(storage({ theme_manually_set: 'true', kegestao_theme: 'dark' }), false)).toBe('dark');
    expect(resolveTheme(storage({ theme_manually_set: 'true', kegestao_theme: 'light' }), true)).toBe('light');
  });

  it('manual sem espelho válido volta ao sistema', () => {
    expect(resolveTheme(storage({ theme_manually_set: 'true' }), true)).toBe('dark');
    expect(resolveTheme(storage({ theme_manually_set: 'true', kegestao_theme: 'roxo' }), false)).toBe('light');
  });
});
