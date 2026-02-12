
import React, { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Customers from './views/Customers';
import EditCustomer from './views/EditCustomer';
import Inventory from './views/Inventory';
import NewSale from './views/NewSale';
import Debtors from './views/Debtors';
import Profile from './views/Profile';
import SplashScreen from './components/SplashScreen';

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
    getDashboardStats,
    toggleTheme
  } = useStore();

  const [showSplash, setShowSplash] = useState(true);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleEditCustomer = (id: string) => {
    setEditingCustomerId(id);
    setCurrentView('edit-customer');
  };

  const getTodayReminders = () => {
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
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={getDashboardStats()} 
            setView={setCurrentView} 
            userName={data.profile.name}
            reminders={getTodayReminders()}
          />
        );
      case 'customers':
        return <Customers customers={data.customers} addCustomer={addCustomer} deleteCustomer={deleteCustomer} getStatus={getCustomerStatus} onEdit={handleEditCustomer} />;
      case 'add-customer':
        return <Customers customers={data.customers} addCustomer={addCustomer} deleteCustomer={deleteCustomer} getStatus={getCustomerStatus} onEdit={handleEditCustomer} initialIsAdding={true} />;
      case 'edit-customer':
        const customerToEdit = data.customers.find(c => c.id === editingCustomerId);
        if (!customerToEdit) {
          setCurrentView('customers');
          return null;
        }
        return <EditCustomer customer={customerToEdit} updateCustomer={updateCustomer} setView={setCurrentView} />;
      case 'inventory':
        return <Inventory products={data.products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />;
      case 'add-product':
        return <Inventory products={data.products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} initialIsAdding={true} />;
      case 'new-sale':
        return <NewSale customers={data.customers} products={data.products} createSale={createSale} setView={setCurrentView} />;
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
            setView={setCurrentView}
          />
        );
      default:
        return (
          <Dashboard 
            stats={getDashboardStats()} 
            setView={setCurrentView} 
            userName={data.profile.name} 
            reminders={getTodayReminders()}
          />
        );
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return data.profile.businessName || 'Ke Gestão';
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
  };

  const currentLayoutView = () => {
    if (currentView === 'add-customer' || currentView === 'edit-customer') return 'customers';
    if (currentView === 'add-product') return 'inventory';
    return currentView;
  };

  return (
    <Layout 
      currentView={currentLayoutView()} 
      setView={setCurrentView} 
      title={getTitle()}
      isDark={data.profile.theme === 'dark'}
      toggleTheme={toggleTheme}
    >
      {renderView()}
    </Layout>
  );
};

export default App;
