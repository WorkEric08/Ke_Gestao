import { AppData, Customer, Installment, Product, Sale, UserProfile } from '../types';
import { byCreatedAt, byDueDate, defaultProfile } from '../core/data';
import { KeGestaoDB } from './db';

const PROFILE_KEY = 'profile';

// O repositório é burro: grava o que recebeu. Quem decide o que existe (cascata, estoque,
// parcelas) é o núcleo; aqui só se aplica, e cada operação é uma transação só.
export const createRepository = (db: KeGestaoDB) => {
  // Escritas em fila: chegam ao banco na ordem em que a tela as fez.
  let queue: Promise<unknown> = Promise.resolve();
  const write = <T>(op: () => Promise<T>): Promise<T> => {
    const run = queue.then(op);
    queue = run.catch(() => undefined);
    return run;
  };

  return {
    // null = banco nunca usado (nem perfil, nem registro): é quando vale migrar o armazenamento antigo.
    async loadAll(): Promise<AppData | null> {
      const [customers, products, sales, installments, profileRow] = await Promise.all([
        db.customers.toArray(),
        db.products.toArray(),
        db.sales.toArray(),
        db.installments.toArray(),
        db.meta.get(PROFILE_KEY)
      ]);
      if (!profileRow && !customers.length && !products.length && !sales.length && !installments.length) {
        return null;
      }
      return {
        customers: customers.sort(byCreatedAt),
        products: products.sort(byCreatedAt),
        sales: sales.sort(byCreatedAt),
        installments: installments.sort(byDueDate),
        profile: { ...defaultProfile(), ...(profileRow?.value as Partial<UserProfile> | undefined) }
      };
    },

    importAll(data: AppData): Promise<void> {
      return write(() =>
        db.transaction('rw', [db.customers, db.products, db.sales, db.installments, db.meta], async () => {
          await db.customers.bulkPut(data.customers);
          await db.products.bulkPut(data.products);
          await db.sales.bulkPut(data.sales);
          await db.installments.bulkPut(data.installments);
          await db.meta.put({ key: PROFILE_KEY, value: data.profile });
        })
      );
    },

    putCustomer: (customer: Customer): Promise<void> => write(() => db.customers.put(customer).then(() => undefined)),
    putProduct: (product: Product): Promise<void> => write(() => db.products.put(product).then(() => undefined)),
    deleteProduct: (id: string): Promise<void> => write(() => db.products.delete(id)),
    putInstallment: (installment: Installment): Promise<void> =>
      write(() => db.installments.put(installment).then(() => undefined)),
    putProfile: (profile: UserProfile): Promise<void> =>
      write(() => db.meta.put({ key: PROFILE_KEY, value: profile }).then(() => undefined)),

    recordSale(sale: Sale, installments: Installment[], changedProducts: Product[]): Promise<void> {
      return write(() =>
        db.transaction('rw', [db.sales, db.installments, db.products], async () => {
          await db.sales.put(sale);
          await db.installments.bulkPut(installments);
          await db.products.bulkPut(changedProducts);
        })
      );
    },

    removeCustomer(customerId: string, saleIds: string[], installmentIds: string[]): Promise<void> {
      return write(() =>
        db.transaction('rw', [db.customers, db.sales, db.installments], async () => {
          await db.installments.bulkDelete(installmentIds);
          await db.sales.bulkDelete(saleIds);
          await db.customers.delete(customerId);
        })
      );
    },

    // Resolve quando todas as escritas já enfileiradas terminaram (usado em testes).
    idle: (): Promise<void> => queue.then(() => undefined)
  };
};

export type Repository = ReturnType<typeof createRepository>;
