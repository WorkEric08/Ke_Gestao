import { View } from './types';
import type { IconName } from './components/Icon';

interface NavItem {
  id: View;
  label: string;
  icon: IconName;
  iconActive: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Início', icon: 'home', iconActive: 'homeFill' },
  { id: 'customers', label: 'Clientes', icon: 'people', iconActive: 'peopleFill' },
  { id: 'inventory', label: 'Estoque', icon: 'box', iconActive: 'box' },
  { id: 'debtors', label: 'Dívidas', icon: 'wallet', iconActive: 'wallet' },
  { id: 'profile', label: 'Perfil', icon: 'person', iconActive: 'personFill' }
];
