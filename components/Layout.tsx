
import React from 'react';
import { View } from '../types';
import { NAV_ITEMS } from '../constants';
import { Moon, Sun } from 'lucide-react';

interface LayoutProps {
  currentView: View;
  setView: (view: View) => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isDark: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  currentView, 
  setView, 
  title, 
  children, 
  actions,
  isDark,
  toggleTheme
}) => {
  return (
    <div className="flex flex-col min-h-screen pb-20 overflow-x-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm px-4 h-16 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 active:scale-90 transition-all"
            aria-label="Alternar Tema"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          {actions}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 w-full max-w-md mx-auto animate-fade-in">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 flex justify-around items-center h-16 safe-area-bottom shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              currentView === item.id ? `text-rose-500` : 'text-gray-400 dark:text-slate-500'
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

export default Layout;
