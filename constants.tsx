
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  AlertCircle, 
  UserCircle 
} from 'lucide-react';
import { View } from './types';

export const NAV_ITEMS = [
  { id: 'dashboard' as View, label: 'Início', icon: <LayoutDashboard size={24} /> },
  { id: 'customers' as View, label: 'Clientes', icon: <Users size={24} /> },
  { id: 'inventory' as View, label: 'Estoque', icon: <Package size={24} /> },
  { id: 'debtors' as View, label: 'Dívidas', icon: <AlertCircle size={24} /> },
  { id: 'profile' as View, label: 'Perfil', icon: <UserCircle size={24} /> },
];

export const THEME = {
  primary: 'rose-500',
  primaryDark: 'rose-600',
  secondary: 'slate-800',
  accent: 'indigo-500',
  success: 'emerald-500',
  error: 'rose-600',
  warning: 'amber-500'
};
