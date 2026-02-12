import { useState, useEffect, useCallback } from 'react';
import { AppData, Customer, Product, Sale, Installment, UserProfile, View } from '../types';

const STORAGE_KEY = 'kegestao_v1';

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

export const useStore = () => {
  const [data, setData] = useState<AppData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const systemTheme = getSystemTheme();
      const hasManualOverride = localStorage.getItem('theme_manually_set') === 'true';
      
      if (!stored) {
        return {
          ...INITIAL_DATA,
          profile: { ...INITIAL_DATA.profile, theme: systemTheme }
        };
      }
      
      const parsed = JSON.parse(stored);
      
      // Se houver override manual, prioriza o que está no localStorage
      // Caso contrário, segue o sistema.
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

  // Aplica o tema visual no DOM e persiste no localStorage
  useEffect(() => {
    if (data.profile.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Escuta mudanças de preferência do sistema operacional
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const hasManualOverride = localStorage.getItem('theme_manually_set') === 'true';
      // Só muda automaticamente se o usuário não tiver feito uma escolha manual antes
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
      localStorage.setItem('theme_manually_set', 'true'); 
      return {
        ...prev,
        profile: {
          ...prev.profile,
          theme: newTheme
        }
      };
    });
  }, []);

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    setData(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCustomer = (id: string) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
      installments: prev.installments.filter(ins => {
        const sale = prev.sales.find(s => s.id === ins.saleId);
        return sale?.customerId !== id;
      }),
      sales: prev.sales.filter(s => s.customerId !== id)
    }));
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: crypto.randomUUID() };
    setData(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const deleteProduct = (id: string) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
  };

  const updateProductStock = (productId: string, quantityChange: number) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, stock: Math.max(0, p.stock + quantityChange) } : p
      )
    }));
  };

  const createSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
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
      const updatedProducts = prev.products.map(p => {
        const item = saleData.items.find(si => si.productId === p.id);
        if (item) return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        return p;
      });
      return {
        ...prev,
        sales: [...prev.sales, newSale],
        installments: [...prev.installments, ...newInstallments],
        products: updatedProducts
      };
    });
  };

  const markInstallmentAsPaid = (installmentId: string) => {
    setData(prev => ({
      ...prev,
      installments: prev.installments.map(ins => 
        ins.id === installmentId ? { ...ins, paidAt: Date.now() } : ins
      )
    }));
  };

  const updateProfile = (profile: UserProfile) => {
    setData(prev => ({ ...prev, profile }));
  };

  const getCustomerStatus = (customerId: string) => {
    const customerInstallments = data.installments.filter(ins => {
      const sale = data.sales.find(s => s.id === ins.saleId);
      return sale?.customerId === customerId;
    });
    const hasOverdue = customerInstallments.some(ins => !ins.paidAt && ins.dueDate < Date.now());
    const hasPending = customerInstallments.some(ins => !ins.paidAt);
    if (hasOverdue) return 'devedor';
    if (hasPending) return 'pendente';
    return 'em dia';
  };

  const getDashboardStats = () => {
    const dateObj = new Date();
    const today = new Date().setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).getTime();
    
    const salesToday = data.sales.filter(s => s.createdAt >= today).reduce((acc, s) => acc + s.total, 0);
    const salesMonth = data.sales.filter(s => s.createdAt >= thisMonthStart).reduce((acc, s) => acc + s.total, 0);
    
    const pendingInstallments = data.installments.filter(ins => !ins.paidAt);
    const totalReceivable = pendingInstallments.reduce((acc, ins) => acc + ins.amount, 0);
    
    const monthlyMap: Record<string, number> = {};
    pendingInstallments.forEach(ins => {
      const d = new Date(ins.dueDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + ins.amount;
    });

    const sortedMonthKeys = Object.keys(monthlyMap).sort();
    const currentMonthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    const receivableThisMonth = monthlyMap[currentMonthKey] || 0;
    const receivableFuture = Object.keys(monthlyMap)
      .filter(key => key > currentMonthKey)
      .reduce((acc, key) => acc + monthlyMap[key], 0);

    const receivablesByMonth = sortedMonthKeys.map(key => ({
      key,
      label: new Date(key + '-02').toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
      total: monthlyMap[key],
      isCurrent: key === currentMonthKey
    }));

    const furthestInstallment = pendingInstallments.length > 0 
      ? Math.max(...pendingInstallments.map(ins => ins.dueDate))
      : null;

    const activeCustomers = data.customers.length;
    const lowStockItems = data.products.filter(p => p.stock <= p.minStock).length;
    
    return { 
      salesToday, 
      salesMonth, 
      totalReceivable, 
      receivableThisMonth,
      receivableFuture,
      receivablesByMonth,
      furthestInstallment,
      activeCustomers, 
      lowStockItems 
    };
  };

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
    getDashboardStats,
    updateProductStock,
    toggleTheme
  };
};