import React, { memo, useState } from 'react';
import { View } from '../types';
import { NAV_ITEMS } from '../constants';
import { Icon } from './Icon';
import { AppBarActionsContext } from './AppBar';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  title: string;
  // Substitui o título padrão da barra superior (a tela inicial tem saudação, avatar e atalhos).
  header?: React.ReactNode;
  children: React.ReactNode;
}

const COLUMN = 'w-full max-w-md md:max-w-2xl lg:max-w-none mx-auto';

const Layout: React.FC<LayoutProps> = ({ currentView, setView, title, header, children }) => {
  const [actions, setActions] = useState<React.ReactNode>(null);

  return (
    <div className="flex min-h-dvh bg-surface text-on-surface overflow-x-clip">

      {/* ── Menu lateral (desktop) ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-surface-low border-r border-outline-variant z-40">
        <div className="h-16 flex items-center gap-3 px-6 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">K</div>
          <span className="text-base font-medium">Ke Gestão</span>
        </div>
        <nav aria-label="Navegação principal" className="flex-1 px-3 py-2 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`h-14 px-4 rounded-full flex items-center gap-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-high'
                }`}
              >
                <Icon name={active ? item.iconActive : item.icon} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 lg:ml-64 min-h-dvh overflow-x-clip">

        {/* ── Barra superior ── */}
        <header className="sticky top-0 z-40 bg-surface pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))]">
          <div className={`${COLUMN} h-16 px-4 lg:px-8 flex items-center`}>
            {header ?? <h1 className="flex-1 text-[22px] leading-7">{title}</h1>}
            {!header && actions && <div className="flex items-center -mr-3">{actions}</div>}
          </div>
        </header>

        <AppBarActionsContext.Provider value={setActions}>
          <main className={`${COLUMN} flex-1 px-4 pt-2 lg:px-8 animate-fade-in pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-10 overflow-x-clip`}>
            {children}
          </main>
        </AppBarActionsContext.Provider>
      </div>

      {/* ── Navegação inferior (celular): 80 dp + área de gesto ── */}
      <nav
        aria-label="Navegação principal"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-nav border-t border-nav-line flex px-2 pt-3 h-[calc(5rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]"
      >
        {NAV_ITEMS.map((item) => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-current={active ? 'page' : undefined}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span
                className={`w-16 h-8 rounded-2xl flex items-center justify-center transition-colors ${
                  active ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant'
                }`}
              >
                <Icon name={active ? item.iconActive : item.icon} />
              </span>
              <span
                className={`text-xs leading-4 font-medium tracking-[0.5px] ${
                  active ? 'text-on-surface' : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default memo(Layout);
