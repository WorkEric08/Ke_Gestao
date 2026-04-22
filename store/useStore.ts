import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppData, Customer, Product, Sale, Installment, UserProfile, View } from '../types';

const STORAGE_KEY = 'kegestao_v1';
const MANUAL_THEME_KEY = 'theme_manually_set';
const PERSIST_DEBOUNCE_MS = 400;

const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const INITIAL_DATA: AppData = {
  customers: [],
  products: [],
  sales: [],
  installments: [],
  profile: {
    name: 'Consultora',
    businessName: 'Ke Gestão',
    currency: 'BRL',
    theme: undefined
  }
};

type CustomerStatus = 'em dia' | 'pendente' | 'devedor';

export const useStore = () => {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const systemTheme = getSystemTheme();
      const hasManualOverride = localStorage.getItem(MANUAL_THEME_KEY) === 'true';

      if (!stored) {
        return {
          ...INITIAL_DATA,
          profile: { ...INITIAL_DATA.profile, theme: systemTheme }
        };
      }

      const parsed = JSON.parse(stored);
      const effectiveTheme = hasManualOverride
        ? (parsed.profile?.theme || systemTheme)
        : systemTheme;

      return {
        ...INITIAL_DATA,
        ...parsed,
        profile: {
          ...INITIAL_DATA.profile,
          ...(parsed.profile || {}),
          theme: effectiveTheme
        }
      };
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      return {
        ...INITIAL_DATA,
        profile: { ...INITIAL_DATA.profile, theme: getSystemTheme() }
      };
    }
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');

  // Aplica o tema visual no DOM sincronamente
  useEffect(() => {
    const root = document.documentElement;
    if (data.profile.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [data.profile.theme]);

  // Persistência em localStorage com debounce — evita serializar a cada keystroke
  const persistTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (persistTimerRef.current !== null) {
      window.clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to persist data', e);
      }
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [data]);

  // Garante que ao sair da página a última mudança seja salva
  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        /* noop */
      }
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [data]);

  // Escuta mudanças de preferência do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const hasManualOverride = localStorage.getItem(MANUAL_THEME_KEY) === 'true';
      if (!hasManualOverride) {
        const newTheme = e.matches ? 'dark' : 'light';
        setData(prev => ({
          ...prev,
          profile: { ...prev.profile, theme: newTheme }
        }));
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    setData(prev => {
      const newTheme = prev.profile.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(MANUAL_THEME_KEY, 'true');
      return {
        ...prev,
        profile: { ...prev.profile, theme: newTheme }
      };
    });
  }, []);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setData(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    return newCustomer;
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setData(prev => {
      const saleIdsToRemove = new Set(prev.sales.filter(s => s.customerId === id).map(s => s.id));
      return {
        ...prev,
        customers: prev.customers.filter(c => c.id !== id),
        installments: prev.installments.filter(ins => !saleIdsToRemove.has(ins.saleId)),
        sales: prev.sales.filter(s => s.customerId !== id)
      };
    });
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: crypto.randomUUID() };
    setData(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  }, []);

  const updateProductStock = useCallback((productId: string, quantityChange: number) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + quantityChange) } : p
      )
    }));
  }, []);

  const createSale = useCallback((saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const saleId = crypto.randomUUID();
    const now = Date.now();
    const newSale: Sale = { ...saleData, id: saleId, createdAt: now };
    const newInstallments: Installment[] = [];
    const installmentAmount = saleData.total / saleData.installments;
    for (let i = 1; i <= saleData.installments; i++) {
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      newInstallments.push({
        id: crypto.randomUUID(),
        saleId,
        number: i,
        amount: installmentAmount,
        dueDate: dueDate.getTime()
      });
    }
    setData(prev => {
      const soldMap = new Map<string, number>();
      saleData.items.forEach(it => soldMap.set(it.productId, it.quantity));
      const updatedProducts = prev.products.map(p => {
        const qty = soldMap.get(p.id);
        if (qty) return { ...p, stock: Math.max(0, p.stock - qty) };
        return p;
      });
      return {
        ...prev,
        sales: [...prev.sales, newSale],
        installments: [...prev.installments, ...newInstallments],
        products: updatedProducts
      };
    });
  }, []);

  const markInstallmentAsPaid = useCallback((installmentId: string) => {
    setData(prev => ({
      ...prev,
      installments: prev.installments.map(ins =>
        ins.id === installmentId ? { ...ins, paidAt: Date.now() } : ins
      )
    }));
  }, []);

  const updateProfile = useCallback((profile: UserProfile) => {
    setData(prev => ({ ...prev, profile }));
  }, []);

  // Map pré-calculado: saleId -> customerId. Evita varrer sales para cada chamada.
  const saleCustomerMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of data.sales) m.set(s.id, s.customerId);
    return m;
  }, [data.sales]);

  // Status por cliente pré-calculado uma única vez quando installments/sales mudam.
  const customerStatusMap = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, CustomerStatus>();
    for (const ins of data.installments) {
      if (ins.paidAt) continue;
      const customerId = saleCustomerMap.get(ins.saleId);
      if (!customerId) continue;
      const current = map.get(customerId);
      if (ins.dueDate < now) {
        map.set(customerId, 'devedor');
      } else if (current !== 'devedor') {
        map.set(customerId, 'pendente');
      }
    }
    return map;
  }, [data.installments, saleCustomerMap]);

  const getCustomerStatus = useCallback((customerId: string): CustomerStatus => {
    return customerStatusMap.get(customerId) || 'em dia';
  }, [customerStatusMap]);

  const dashboardStats = useMemo(() => {
    const dateObj = new Date();
    const today = new Date().setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime();

    let salesToday = 0;
    let salesMonth = 0;
    for (const s of data.sales) {
      if (s.createdAt >= today) salesToday += s.total;
      if (s.createdAt >= thisMonthStart) salesMonth += s.total;
    }

    let totalReceivable = 0;
    const monthlyMap: Record<string, number> = {};
    let furthestInstallment: number | null = null;

    for (const ins of data.installments) {
      if (ins.paidAt) continue;
      totalReceivable += ins.amount;
      const d = new Date(ins.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + ins.amount;
      if (furthestInstallment === null || ins.dueDate > furthestInstallment) {
        furthestInstallment = ins.dueDate;
      }
    }

    const sortedMonthKeys = Object.keys(monthlyMap).sort();
    const currentMonthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    const receivableThisMonth = monthlyMap[currentMonthKey] || 0;
    let receivableFuture = 0;
    for (const key of sortedMonthKeys) {
      if (key > currentMonthKey) receivableFuture += monthlyMap[key];
    }

    const receivablesByMonth = sortedMonthKeys.map(key => ({
      key,
      label: new Date(key + '-02').toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
      total: monthlyMap[key],
      isCurrent: key === currentMonthKey
    }));

    let lowStockItems = 0;
    for (const p of data.products) {
      if (p.stock <= p.minStock) lowStockItems += 1;
    }

    return {
      salesToday,
      salesMonth,
      totalReceivable,
      receivableThisMonth,
      receivableFuture,
      receivablesByMonth,
      furthestInstallment,
      activeCustomers: data.customers.length,
      lowStockItems
    };
  }, [data.sales, data.installments, data.products, data.customers]);

  return {
    data,
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
    updateProductStock,
    toggleTheme
  };
};
