import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Customers from './views/Customers';
import EditCustomer from './views/EditCustomer';
import Inventory from './views/Inventory';
import NewSale from './views/NewSale';
import Debtors from './views/Debtors';
import Profile from './views/Profile';

const App: React.FC = () => {
  const {
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
    toggleTheme
  } = useStore();

  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) setIsAppInstalled(true);

    // O evento beforeinstallprompt já pode ter disparado antes do React montar.
    // O index.html guarda o evento em window.__deferredInstallPrompt — recolhemos aqui.
    const preCaptured = (window as any).__deferredInstallPrompt;
    if (preCaptured) setDeferredPrompt(preCaptured);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__deferredInstallPrompt = e;
      setDeferredPrompt(e);
    };

    const handleInstallAvailable = () => {
      const captured = (window as any).__deferredInstallPrompt;
      if (captured) setDeferredPrompt(captured);
    };

    const handleAppInstalled = () => {
      (window as any).__deferredInstallPrompt = null;
      setDeferredPrompt(null);
      setIsAppInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa:installavailable', handleInstallAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa:installavailable', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setIsAppInstalled(true);
      }
    } catch (err) {
      console.error('Ke Gestão: erro ao acionar prompt de instalação', err);
    } finally {
      // O prompt só pode ser usado uma vez — descarta seja qual for o resultado.
      (window as any).__deferredInstallPrompt = null;
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleEditCustomer = useCallback((id: string) => {
    setEditingCustomerId(id);
    setCurrentView('edit-customer');
  }, [setCurrentView]);

  const todayReminders = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return data.installments
      .filter(ins => {
        const insDate = new Date(ins.dueDate).setHours(0, 0, 0, 0);
        return insDate === today && !ins.paidAt;
      })
      .map(ins => {
        const sale = data.sales.find(s => s.id === ins.saleId);
        const customer = data.customers.find(c => c.id === sale?.customerId);
        return {
          id: ins.id,
          customerName: customer?.name || 'Cliente',
          amount: ins.amount
        };
      });
  }, [data.installments, data.sales, data.customers]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            stats={dashboardStats}
            setView={setCurrentView}
            userName={data.profile.name}
            reminders={todayReminders}
          />
        );
      case 'customers':
        return <Customers customers={data.customers} addCustomer={addCustomer} deleteCustomer={deleteCustomer} getStatus={getCustomerStatus} onEdit={handleEditCustomer} />;
      case 'add-customer':
        return <Customers customers={data.customers} addCustomer={addCustomer} deleteCustomer={deleteCustomer} getStatus={getCustomerStatus} onEdit={handleEditCustomer} initialIsAdding={true} />;
      case 'edit-customer': {
        const customerToEdit = data.customers.find(c => c.id === editingCustomerId);
        if (!customerToEdit) {
          setCurrentView('customers');
          return null;
        }
        return <EditCustomer customer={customerToEdit} updateCustomer={updateCustomer} setView={setCurrentView} />;
      }
      case 'inventory':
        return <Inventory products={data.products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />;
      case 'add-product':
        return <Inventory products={data.products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} initialIsAdding={true} />;
      case 'new-sale':
        return <NewSale customers={data.customers} products={data.products} createSale={createSale} setView={setCurrentView} getCustomerStatus={getCustomerStatus} />;
      case 'debtors':
        return (
          <Debtors
            installments={data.installments}
            customers={data.customers}
            sales={data.sales}
            products={data.products}
            markPaid={markInstallmentAsPaid}
          />
        );
      case 'profile':
        return (
          <Profile
            profile={data.profile}
            updateProfile={updateProfile}
            canInstall={!!deferredPrompt}
            onInstall={handleInstallApp}
            isInstalled={isAppInstalled}
            isIOS={isIOS}
            isAndroid={isAndroid}
            setView={setCurrentView}
            isDark={data.profile.theme === 'dark'}
            toggleTheme={toggleTheme}
          />
        );
      default:
        return (
          <Dashboard
            stats={dashboardStats}
            setView={setCurrentView}
            userName={data.profile.name}
            reminders={todayReminders}
          />
        );
    }
  };

  const title = useMemo(() => {
    switch (currentView) {
      case 'dashboard': return 'Início';
      case 'customers':
      case 'add-customer':
      case 'edit-customer': return 'Clientes';
      case 'inventory':
      case 'add-product': return 'Estoque';
      case 'new-sale': return 'Nova Venda';
      case 'debtors': return 'Financeiro';
      case 'profile': return 'Meu Perfil';
      default: return 'Ke Gestão';
    }
  }, [currentView, data.profile.businessName]);

  const layoutView = useMemo(() => {
    if (currentView === 'add-customer' || currentView === 'edit-customer') return 'customers';
    if (currentView === 'add-product') return 'inventory';
    return currentView;
  }, [currentView]);

  return (
    <Layout
      currentView={layoutView}
      setView={setCurrentView}
      title={title}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
