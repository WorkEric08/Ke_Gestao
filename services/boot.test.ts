import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { KeGestaoDB } from './db';
import { loadOrMigrate } from './boot';
import { LEGACY_KEY } from './legacy';
import { createRepository } from './repository';
import { MANUAL_KEY, THEME_KEY } from './theme';

class FakeStorage {
  private map = new Map<string, string>();
  constructor(init: Record<string, string> = {}) { for (const [k, v] of Object.entries(init)) this.map.set(k, v); }
  getItem(k: string) { return this.map.get(k) ?? null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
}

let counter = 0;
const opened: KeGestaoDB[] = [];
const fresh = () => {
  const db = new KeGestaoDB(`boot-${++counter}`);
  opened.push(db);
  return createRepository(db);
};
afterEach(async () => {
  for (const db of opened.splice(0)) { db.close(); await db.delete(); }
});

const legacyBlob = (extra: object = {}) => JSON.stringify({
  customers: [{ id: 'c1', name: 'Ana', phone: '47999990000', createdAt: 100 }],
  products: [
    { id: 'p1', name: 'Batom', category: 'Maquiagem', price: 33.4, stock: 5, minStock: 2 },
    { id: 'p2', name: 'Perfume', category: 'Fragrâncias', price: 99.9, stock: 1, minStock: 2 }
  ],
  sales: [{ id: 's1', customerId: 'c1', items: [{ productId: 'p1', quantity: 1, unitPrice: 33.4 }], total: 33.4, paymentMethod: 'pix', installments: 1, createdAt: 200 }],
  installments: [{ id: 'i1', saleId: 's1', number: 1, amount: 33.4, dueDate: 300, paidAt: 310 }],
  profile: { name: 'Keila', businessName: 'Loja', currency: 'BRL', theme: 'dark' },
  ...extra
});

describe('loadOrMigrate', () => {
  it('migra o JSON antigo para o banco e o apaga depois de conferir', async () => {
    const repo = fresh();
    const storage = new FakeStorage({ [LEGACY_KEY]: legacyBlob() });
    const data = await loadOrMigrate(repo, storage, 1000);

    expect(data.customers.map(c => c.name)).toEqual(['Ana']);
    expect(data.installments[0].paidAt).toBe(310);
    expect(data.profile.name).toBe('Keila');
    expect(storage.getItem(LEGACY_KEY)).toBeNull();
    // o que o app lê da próxima vez vem do banco
    expect(await repo.loadAll()).toEqual(data);
  });

  it('produtos antigos, sem createdAt, mantêm a ordem em que estavam', async () => {
    const repo = fresh();
    const data = await loadOrMigrate(repo, new FakeStorage({ [LEGACY_KEY]: legacyBlob() }), 1000);
    expect(data.products.map(p => p.name)).toEqual(['Batom', 'Perfume']);
    expect((await repo.loadAll())!.products.map(p => p.name)).toEqual(['Batom', 'Perfume']);
  });

  it('leva o tema escolhido à mão para o espelho da primeira pintura', async () => {
    const storage = new FakeStorage({ [LEGACY_KEY]: legacyBlob(), [MANUAL_KEY]: 'true' });
    await loadOrMigrate(fresh(), storage, 1000);
    expect(storage.getItem(THEME_KEY)).toBe('dark');
  });

  it('não cria o espelho se o tema nunca foi escolhido à mão', async () => {
    const storage = new FakeStorage({ [LEGACY_KEY]: legacyBlob() });
    await loadOrMigrate(fresh(), storage, 1000);
    expect(storage.getItem(THEME_KEY)).toBeNull();
  });

  it('o banco sempre vence: com dados lá, o JSON antigo é ignorado (e deixado como está)', async () => {
    const repo = fresh();
    await repo.putCustomer({ id: 'novo', name: 'Nova', phone: '1', createdAt: 1 });
    const storage = new FakeStorage({ [LEGACY_KEY]: legacyBlob() });
    const data = await loadOrMigrate(repo, storage, 1000);
    expect(data.customers.map(c => c.id)).toEqual(['novo']);
    expect(storage.getItem(LEGACY_KEY)).not.toBeNull();
  });

  it('abrir de novo depois de migrar devolve os mesmos dados, sem remigrar', async () => {
    const repo = fresh();
    const storage = new FakeStorage({ [LEGACY_KEY]: legacyBlob() });
    const first = await loadOrMigrate(repo, storage, 1000);
    const second = await loadOrMigrate(repo, storage, 2000);
    expect(second).toEqual(first);
  });

  it('sem banco e sem JSON antigo: começa vazio e não grava nada', async () => {
    const repo = fresh();
    const data = await loadOrMigrate(repo, new FakeStorage(), 1000);
    expect(data.customers).toEqual([]);
    expect(await repo.loadAll()).toBeNull();
  });

  it('JSON antigo corrompido: começa vazio e não apaga o que não entendeu', async () => {
    const storage = new FakeStorage({ [LEGACY_KEY]: '{isto não é json' });
    const data = await loadOrMigrate(fresh(), storage, 1000);
    expect(data.customers).toEqual([]);
    expect(storage.getItem(LEGACY_KEY)).toBe('{isto não é json');
  });
});
