import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import { HomeAppBar } from './components/AppBar';
import Dashboard from './views/Dashboard';

// Só o Dashboard (tela inicial) vai no pacote principal; as demais views carregam sob demanda.
// O service worker pré-cacheia todos os pedaços, então continuam funcionando offline.
const Customers = lazy(() => import('./views/Customers'));
const EditCustomer = lazy(() => import('./views/EditCustomer'));
const Inventory = lazy(() => import('./views/Inventory'));
const NewSale = lazy(() => import('./views/NewSale'));
const Debtors = lazy(() => import('./views/Debtors'));
const Profile = lazy(() => import('./views/Profile'));

const App: React.FC = () => {
  const {
    data,
    ready,
    saveError,
    dismissSaveError,
    todayReminders,
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

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            stats={dashboardStats}
            setView={setCurrentView}
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
            isDark={data.profile.theme === 'dark'}
            toggleTheme={toggleTheme}
          />
        );
      default:
        return (
          <Dashboard
            stats={dashboardStats}
            setView={setCurrentView}
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
      case 'profile': return 'Perfil';
      default: return 'Ke Gestão';
    }
  }, [currentView, data.profile.businessName]);

  const layoutView = useMemo(() => {
    if (currentView === 'add-customer' || currentView === 'edit-customer') return 'customers';
    if (currentView === 'add-product') return 'inventory';
    return currentView;
  }, [currentView]);

  const homeHeader = currentView === 'dashboard' ? (
    <HomeAppBar
      userName={data.profile.name}
      hasReminders={todayReminders.length > 0}
      onProfile={() => setCurrentView('profile')}
      onSearch={() => setCurrentView('customers')}
      onNotifications={() => setCurrentView('debtors')}
    />
  ) : undefined;

  // Enquanto o banco abre (poucos ms) fica só o fundo; evita mostrar o app vazio e depois "pular".
  if (!ready) return <div className="min-h-dvh bg-gray-50 dark:bg-slate-950" aria-busy="true" />;

  return (
    <Layout
      currentView={layoutView}
      setView={setCurrentView}
      title={title}
      header={homeHeader}
    >
      {saveError && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-300">
          <p className="flex-1">Não foi possível salvar os dados neste aparelho. O que você fizer agora pode se perder ao fechar o app. Libere espaço no aparelho e tente de novo.</p>
          <button onClick={dismissSaveError} className="shrink-0 min-h-11 px-2 font-bold underline">Fechar</button>
        </div>
      )}
      <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
        {renderView()}
      </Suspense>
    </Layout>
  );
};

export default App;
