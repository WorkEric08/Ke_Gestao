import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppData, Customer, CustomerStatus, Product, Sale, UserProfile, View } from '../types';
import { emptyData } from '../core/data';
import { buildInstallments, customerStatuses } from '../core/finance';
import { cascadeOfCustomer, deductStock, saleTotal } from '../core/sales';
import { dashboardStats as computeStats, todayReminders as computeReminders } from '../core/stats';
import { startOfDay } from '../core/time';
import { boot } from '../services/boot';
import type { Repository } from '../services/repository';
import { MANUAL_KEY, Theme, resolveTheme, saveManualTheme } from '../services/theme';

const DAY_CHECK_MS = 60_000;

const systemIsDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const initialTheme = (): Theme => {
  try {
    return resolveTheme(localStorage, systemIsDark());
  } catch {
    return systemIsDark() ? 'dark' : 'light';
  }
};

export const useStore = () => {
  const [data, setData] = useState<AppData>(() => {
    const initial = emptyData();
    return { ...initial, profile: { ...initial.profile, theme: initialTheme() } };
  });
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  // Início do dia de hoje: as contas que dependem da data (vencida, vence hoje) recalculam quando o dia vira.
  const [today, setToday] = useState(() => startOfDay(Date.now()));

  // O estado mais recente, lido pelas ações: duas ações no mesmo tique enxergam uma à outra,
  // e nenhuma escrita acontece dentro de um updater do React (que o modo estrito roda duas vezes).
  const dataRef = useRef(data);
  const repoRef = useRef<Repository | null>(null);

  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
  }, []);

  const persist = useCallback((write: (repository: Repository) => Promise<void>) => {
    const repository = repoRef.current;
    if (!repository) {
      setSaveError(true);
      return;
    }
    write(repository).catch(e => {
      console.error('Ke Gestão: falha ao salvar', e);
      setSaveError(true);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    boot().then(({ repository, data: loaded, failed }) => {
      if (!alive) return;
      repoRef.current = repository;
      commit({ ...loaded, profile: { ...loaded.profile, theme: initialTheme() } });
      if (failed) setSaveError(true);
      setReady(true);
    });
    return () => { alive = false; };
  }, [commit]);

  // Só depois de abrir: até lá vale a classe que o index.html pôs antes da primeira pintura.
  useEffect(() => {
    if (!ready) return;
    document.documentElement.classList.toggle('dark', data.profile.theme === 'dark');
  }, [ready, data.profile.theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem(MANUAL_KEY) === 'true') return;
      const current = dataRef.current;
      commit({ ...current, profile: { ...current.profile, theme: e.matches ? 'dark' : 'light' } });
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [commit]);

  useEffect(() => {
    const sync = () => setToday(prev => {
      const next = startOfDay(Date.now());
      return next === prev ? prev : next;
    });
    const timer = window.setInterval(sync, DAY_CHECK_MS);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const current = dataRef.current;
    const theme: Theme = current.profile.theme === 'dark' ? 'light' : 'dark';
    try {
      saveManualTheme(localStorage, theme);
    } catch { /* sem localStorage: o tema vale só nesta sessão */ }
    const profile = { ...current.profile, theme };
    commit({ ...current, profile });
    persist(r => r.putProfile(profile));
  }, [commit, persist]);

  const addCustomer = useCallback((input: Omit<Customer, 'id' | 'createdAt'>) => {
    const customer: Customer = { ...input, id: crypto.randomUUID(), createdAt: Date.now() };
    const current = dataRef.current;
    commit({ ...current, customers: [...current.customers, customer] });
    persist(r => r.putCustomer(customer));
    return customer;
  }, [commit, persist]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    const current = dataRef.current;
    const existing = current.customers.find(c => c.id === id);
    if (!existing) return;
    const customer: Customer = { ...existing, ...updates, id };
    commit({ ...current, customers: current.customers.map(c => (c.id === id ? customer : c)) });
    persist(r => r.putCustomer(customer));
  }, [commit, persist]);

  const deleteCustomer = useCallback((id: string) => {
    const current = dataRef.current;
    const { saleIds, installmentIds } = cascadeOfCustomer(current.sales, current.installments, id);
    const goneSales = new Set(saleIds);
    const goneInstallments = new Set(installmentIds);
    commit({
      ...current,
      customers: current.customers.filter(c => c.id !== id),
      sales: current.sales.filter(s => !goneSales.has(s.id)),
      installments: current.installments.filter(i => !goneInstallments.has(i.id))
    });
    persist(r => r.removeCustomer(id, saleIds, installmentIds));
  }, [commit, persist]);

  const addProduct = useCallback((input: Omit<Product, 'id' | 'createdAt'>) => {
    const product: Product = { ...input, id: crypto.randomUUID(), createdAt: Date.now() };
    const current = dataRef.current;
    commit({ ...current, products: [...current.products, product] });
    persist(r => r.putProduct(product));
  }, [commit, persist]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    const current = dataRef.current;
    const existing = current.products.find(p => p.id === id);
    if (!existing) return;
    const product: Product = { ...existing, ...updates, id, createdAt: existing.createdAt };
    commit({ ...current, products: current.products.map(p => (p.id === id ? product : p)) });
    persist(r => r.putProduct(product));
  }, [commit, persist]);

  const deleteProduct = useCallback((id: string) => {
    const current = dataRef.current;
    commit({ ...current, products: current.products.filter(p => p.id !== id) });
    persist(r => r.deleteProduct(id));
  }, [commit, persist]);

  // O total sai dos itens (uma regra só); o valor que a tela mostra usa a mesma função.
  const createSale = useCallback((input: Omit<Sale, 'id' | 'createdAt' | 'total'>) => {
    const current = dataRef.current;
    const sale: Sale = { ...input, id: crypto.randomUUID(), createdAt: Date.now(), total: saleTotal(input.items) };
    const installments = buildInstallments(sale, () => crypto.randomUUID());
    const changed = new Map(deductStock(current.products, sale.items).map(p => [p.id, p]));
    commit({
      ...current,
      sales: [...current.sales, sale],
      installments: [...current.installments, ...installments],
      products: current.products.map(p => changed.get(p.id) ?? p)
    });
    persist(r => r.recordSale(sale, installments, [...changed.values()]));
  }, [commit, persist]);

  const markInstallmentAsPaid = useCallback((id: string) => {
    const current = dataRef.current;
    const existing = current.installments.find(i => i.id === id);
    if (!existing || existing.paidAt) return;
    const installment = { ...existing, paidAt: Date.now() };
    commit({ ...current, installments: current.installments.map(i => (i.id === id ? installment : i)) });
    persist(r => r.putInstallment(installment));
  }, [commit, persist]);

  const updateProfile = useCallback((profile: UserProfile) => {
    commit({ ...dataRef.current, profile });
    persist(r => r.putProfile(profile));
  }, [commit, persist]);

  const customerStatusMap = useMemo(
    () => customerStatuses(data.installments, data.sales, today),
    [data.installments, data.sales, today]
  );

  const getCustomerStatus = useCallback(
    (customerId: string): CustomerStatus => customerStatusMap.get(customerId) ?? 'em dia',
    [customerStatusMap]
  );

  const dashboardStats = useMemo(
    () => computeStats(data, today),
    [data.sales, data.installments, data.products, data.customers, today]
  );

  const todayReminders = useMemo(
    () => computeReminders(data, today),
    [data.installments, data.sales, data.customers, today]
  );

  return {
    data,
    ready,
    saveError,
    dismissSaveError: useCallback(() => setSaveError(false), []),
    currentView,
    setCurrentView,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addProduct,
    updateProduct,
    deleteProduct,
    createSale,
    markInstallmentAsPaid,
    updateProfile,
    getCustomerStatus,
    dashboardStats,
    todayReminders,
    toggleTheme
  };
};
