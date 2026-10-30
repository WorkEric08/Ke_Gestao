import { View } from '../types';

// Para onde o botão "voltar" do Android leva. null = já está na tela inicial: o app fecha.
// A navegação do app é por estado (sem rota no histórico), então o voltar do sistema precisa desta regra.
export const backTarget = (view: View): View | null => {
  switch (view) {
    case 'dashboard':
      return null;
    case 'add-customer':
    case 'edit-customer':
      return 'customers';
    case 'add-product':
      return 'inventory';
    default:
      return 'dashboard';
  }
};
