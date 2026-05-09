
import React, { memo } from 'react';
import { View } from '../types';
import { NAV_ITEMS } from '../constants';
import {
  LayoutDashboard, Users, Package, AlertCircle, UserCircle
} from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const SIDEBAR_ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  customers: <Users size={20} />,
  inventory: <Package size={20} />,
  debtors: <AlertCircle size={20} />,
  profile: <UserCircle size={20} />,
};

const Layout: React.FC<LayoutProps> = ({
  currentView,
  setView,
  title,
  children,
  actions,
}) => {

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 z-40 shadow-sm">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center shadow-sm shadow-rose-200 dark:shadow-none">
              <span className="text-white font-black text-sm">K</span>
            </div>
            <span className="text-base font-black text-gray-800 dark:text-slate-100 tracking-tight">Ke Gestão</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-semibold transition-all group ${
                currentView === item.id
                  ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              <span className={`transition-transform group-hover:scale-110 ${currentView === item.id ? 'scale-110' : ''}`}>
                {SIDEBAR_ICONS[item.id]}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* ── Main area (pushed right on desktop) ── */}
      <div className="flex flex-col flex-1 lg:ml-60 min-h-screen overflow-x-hidden">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm px-4 lg:px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">{title}</h1>
          <div className="flex items-center gap-2">
            {actions}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 w-full max-w-md lg:max-w-none mx-auto animate-fade-in pb-20 lg:pb-10 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ── Bottom Navigation (mobile only) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-around items-center h-16 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === item.id ? 'text-rose-500' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
};

export default memo(Layout);
