import { describe, expect, it } from 'vitest';
import { View } from '../types';
import { backTarget } from './navigation';

describe('backTarget (botão voltar do Android)', () => {
  it('na tela inicial o app fecha', () => {
    expect(backTarget('dashboard')).toBeNull();
  });

  it('telas de cliente e de produto voltam para a lista de onde vieram', () => {
    expect(backTarget('add-customer')).toBe('customers');
    expect(backTarget('edit-customer')).toBe('customers');
    expect(backTarget('add-product')).toBe('inventory');
  });

  it('as demais voltam para a tela inicial', () => {
    for (const v of ['customers', 'inventory', 'debtors', 'profile', 'new-sale'] as View[]) {
      expect(backTarget(v)).toBe('dashboard');
    }
  });

  it('nunca devolve a própria tela (senão o voltar não sairia do lugar)', () => {
    const all: View[] = ['dashboard', 'customers', 'inventory', 'sales', 'debtors', 'profile', 'new-sale', 'add-customer', 'add-product', 'edit-customer'];
    for (const v of all) expect(backTarget(v)).not.toBe(v);
  });
});
