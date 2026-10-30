import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { AppData, Customer, Installment, Product, Sale } from '../types';
import { emptyData } from '../core/data';
import { KeGestaoDB } from './db';
import { createRepository } from './repository';

let counter = 0;
const opened: KeGestaoDB[] = [];
const fresh = () => {
  const db = new KeGestaoDB(`teste-${++counter}`);
  opened.push(db);
  return { db, repo: createRepository(db) };
};
afterEach(async () => {
  for (const db of opened.splice(0)) {
    db.close();
    await db.delete();
  }
});

const customer = (id: string, createdAt: number): Customer => ({ id, name: id, phone: '1', createdAt });
const product = (id: string, createdAt: number, stock = 5): Product => ({
  id, name: id, category: 'c', price: 10, stock, minStock: 2, createdAt
});
const sale = (id: string, customerId: string, createdAt = 1): Sale => ({
  id, customerId, items: [{ productId: 'p', quantity: 1, unitPrice: 10 }],
  total: 10, paymentMethod: 'pix', installments: 1, createdAt
});
const ins = (id: string, saleId: string, dueDate: number, number = 1): Installment => ({
  id, saleId, number, amount: 10, dueDate
});

describe('loadAll', () => {
  it('devolve null num banco que nunca foi usado', async () => {
    expect(await fresh().repo.loadAll()).toBeNull();
  });

  it('ida e volta de tudo, com o perfil mesclado aos padrões', async () => {
    const { repo } = fresh();
    const data: AppData = {
      customers: [customer('c1', 1)],
      products: [product('p1', 1)],
      sales: [sale('s1', 'c1')],
      installments: [{ ...ins('i1', 's1', 5), paidAt: 9 }],
      profile: { name: 'Keila', businessName: 'Loja', currency: 'BRL', theme: 'dark' }
    };
    await repo.importAll(data);
    expect(await repo.loadAll()).toEqual(data);
  });

  it('só o perfil gravado já conta como banco usado', async () => {
    const { repo } = fresh();
    await repo.putProfile({ name: 'Ana', businessName: 'X', currency: 'BRL' });
    const loaded = await repo.loadAll();
    expect(loaded?.profile.name).toBe('Ana');
    expect(loaded?.customers).toEqual([]);
  });

  it('a ordem não depende do id nem da ordem de gravação', async () => {
    const { repo } = fresh();
    // ids em ordem contrária à de criação, gravados fora de ordem
    await repo.putProduct(product('a', 30));
    await repo.putProduct(product('z', 10));
    await repo.putProduct(product('m', 20));
    await repo.putCustomer(customer('b', 5));
    await repo.putCustomer(customer('a', 5)); // empate: desempata por id
    const loaded = await repo.loadAll();
    expect(loaded?.products.map(p => p.id)).toEqual(['z', 'm', 'a']);
    expect(loaded?.customers.map(c => c.id)).toEqual(['a', 'b']);
  });

  it('parcelas ordenam por vencimento, depois por número', async () => {
    const { repo } = fresh();
    await repo.importAll({
      ...emptyData(),
      installments: [ins('x', 's', 20, 2), ins('y', 's', 10, 1), ins('w', 's', 20, 1)]
    });
    expect((await repo.loadAll())?.installments.map(i => i.id)).toEqual(['y', 'w', 'x']);
  });
});

describe('escritas', () => {
  it('put substitui e delete remove', async () => {
    const { repo } = fresh();
    await repo.putProduct(product('p', 1, 5));
    await repo.putProduct({ ...product('p', 1), stock: 2 });
    await repo.putProduct(product('q', 2));
    await repo.deleteProduct('q');
    const products = (await repo.loadAll())!.products;
    expect(products.map(p => [p.id, p.stock])).toEqual([['p', 2]]);
  });

  it('recordSale grava venda, parcelas e estoque juntos', async () => {
    const { repo } = fresh();
    await repo.importAll({ ...emptyData(), products: [product('p', 1, 5)] });
    await repo.recordSale(sale('s1', 'c1'), [ins('i1', 's1', 1), ins('i2', 's1', 2, 2)], [product('p', 1, 4)]);
    const d = (await repo.loadAll())!;
    expect(d.sales.map(s => s.id)).toEqual(['s1']);
    expect(d.installments.map(i => i.id)).toEqual(['i1', 'i2']);
    expect(d.products[0].stock).toBe(4);
  });

  it('recordSale que falha no meio não deixa nada pela metade', async () => {
    const { db, repo } = fresh();
    await repo.importAll({ ...emptyData(), products: [product('p', 1, 5)] });
    const poisoned = { id: undefined } as unknown as Installment; // chave inválida: a transação aborta
    await expect(repo.recordSale(sale('s1', 'c1'), [poisoned], [product('p', 1, 0)])).rejects.toThrow();
    expect(await db.sales.count()).toBe(0);
    expect((await db.products.get('p'))?.stock).toBe(5);
  });

  it('removeCustomer leva só o que recebeu', async () => {
    const { repo } = fresh();
    await repo.importAll({
      ...emptyData(),
      customers: [customer('ana', 1), customer('bia', 2)],
      sales: [sale('s1', 'ana'), sale('s2', 'bia')],
      installments: [ins('i1', 's1', 1), ins('i2', 's2', 1)]
    });
    await repo.removeCustomer('ana', ['s1'], ['i1']);
    const d = (await repo.loadAll())!;
    expect(d.customers.map(c => c.id)).toEqual(['bia']);
    expect(d.sales.map(s => s.id)).toEqual(['s2']);
    expect(d.installments.map(i => i.id)).toEqual(['i2']);
  });

  it('as escritas chegam ao banco na ordem em que foram pedidas', async () => {
    const { repo } = fresh();
    const pending: Promise<void>[] = [];
    for (let stock = 1; stock <= 30; stock++) pending.push(repo.putProduct(product('p', 1, stock)));
    await Promise.all(pending);
    expect((await repo.loadAll())!.products[0].stock).toBe(30);
  });

  it('uma escrita que falha não trava as seguintes', async () => {
    const { repo } = fresh();
    const bad = repo.putProduct({ id: undefined } as unknown as Product);
    const good = repo.putProduct(product('ok', 1));
    await expect(bad).rejects.toThrow();
    await good;
    expect((await repo.loadAll())!.products.map(p => p.id)).toEqual(['ok']);
  });
});
