
export type View = 'dashboard' | 'customers' | 'inventory' | 'sales' | 'debtors' | 'profile' | 'new-sale' | 'add-customer' | 'add-product' | 'edit-customer';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
}

export interface Installment {
  id: string;
  saleId: string;
  number: number;
  amount: number;
  dueDate: number;
  paidAt?: number;
}

export interface Sale {
  id: string;
  customerId: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'pix' | 'credit_card' | 'debit_card' | 'cash';
  installments: number;
  createdAt: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface UserProfile {
  name: string;
  businessName: string;
  currency: string;
  theme?: 'light' | 'dark';
}

export interface AppData {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  installments: Installment[];
  profile: UserProfile;
}