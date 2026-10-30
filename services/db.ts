import Dexie, { type Table } from 'dexie';
import { Customer, Installment, Product, Sale } from '../types';

export interface MetaRow {
  key: string;
  value: unknown;
}

// Só entram índices que alguma consulta usa. Campo novo sem índice entra numa versão nova
// com `.upgrade()` que dá o valor padrão a quem já existia.
export class KeGestaoDB extends Dexie {
  customers!: Table<Customer, string>;
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  installments!: Table<Installment, string>;
  meta!: Table<MetaRow, string>;

  constructor(name = 'kegestao') {
    super(name);
    this.version(1).stores({
      customers: 'id',
      products: 'id',
      sales: 'id, customerId',
      installments: 'id, saleId',
      meta: 'key'
    });
  }
}
