
import React, { useState, useMemo, useRef } from 'react';
import { Card, Badge, Button } from './UI';
import { Search, X, UserPlus, Phone, CheckCircle2, ChevronRight } from 'lucide-react';
import { formatPhone } from '../utils/format';
import { Customer } from '../types';

interface CustomerSelectorProps {
  customers: Customer[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  getStatus: (id: string) => string;
  onAddCustomer: () => void;
}

type FilterStatus = 'todos' | 'em dia' | 'pendente' | 'devedor';

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ 
  customers, 
  selectedId, 
  onSelect, 
  onClose, 
  getStatus,
  onAddCustomer 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const groupedCustomers = useMemo(() => {
    const filtered = customers
      .filter(c => {
        const term = searchTerm.toLowerCase().trim();
        let matchesSearch = true;
        
        if (term.length === 1) {
          matchesSearch = c.name.toLowerCase().startsWith(term);
        } else if (term.length > 1) {
          matchesSearch = c.name.toLowerCase().includes(term) || c.phone.includes(term);
        }
        
        const status = getStatus(c.id);
        const matchesFilter = filterStatus === 'todos' || status === filterStatus;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const groups: Record<string, Customer[]> = {};
    filtered.forEach(c => {
      const letter = c.name.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    });

    return groups;
  }, [customers, searchTerm, filterStatus, getStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'devedor': return 'rose';
      case 'pendente': return 'amber';
      case 'em dia': return 'emerald';
      default: return 'gray';
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white dark:bg-[#020617] flex flex-col h-[100dvh] w-full animate-fade-in overflow-hidden">
      {/* Header Compacto */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 px-4 h-14 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col">
          <h4 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Selecionar Cliente</h4>
          <span className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-0.5">Passo 1 de 3</span>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl active:scale-90 transition-all"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="p-3 flex flex-col gap-3 bg-white dark:bg-[#020617] sticky top-14 z-20">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 transition-colors group-focus-within:text-rose-500" size={16} />
            <input
              ref={searchInputRef}
              placeholder="Pesquisar cliente..."
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl pl-10 pr-10 py-3 focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-200 dark:focus:border-rose-900/50 text-sm transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button 
                onClick={() => {setSearchTerm(''); searchInputRef.current?.focus();}}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 p-1.5"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={onAddCustomer}
            className="bg-rose-500 text-white p-3.5 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-all"
          >
            <UserPlus size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-mask">
          <div className="flex gap-1.5">
            {['todos', 'em dia', 'pendente', 'devedor'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as FilterStatus)}
                className={`px-4 py-2 rounded-full text-[10px] font-black transition-all whitespace-nowrap border capitalize tracking-tight ${
                  filterStatus === status 
                    ? 'bg-rose-500 border-rose-500 text-white shadow-sm' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listagem com Cards Menores */}
      <div className="flex-1 overflow-y-auto px-3 pb-20 beauty-scroll bg-slate-50 dark:bg-[#020617]">
        <div className="flex flex-col gap-4 pt-2">
          {Object.keys(groupedCustomers).length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-4 animate-fade-in">
              <Search size={32} className="opacity-10" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhuma cliente encontrada</p>
              <Button variant="outline" onClick={onAddCustomer} className="rounded-xl px-6 text-xs border-rose-200 text-rose-500 h-10">
                Cadastrar Agora
              </Button>
            </div>
          ) : (
            Object.keys(groupedCustomers).sort().map(letter => (
              <div key={letter} className="flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center gap-2 px-1 sticky top-0 z-10 py-1 bg-slate-50 dark:bg-[#020617]">
                  <span className="text-[10px] font-black text-rose-500/30 dark:text-rose-400/20 uppercase tracking-[0.2em]">{letter}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-900/50"></div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {groupedCustomers[letter].map(customer => {
                    const status = getStatus(customer.id);
                    const isSelected = selectedId === customer.id;
                    
                    return (
                      <div 
                        key={customer.id} 
                        onClick={() => onSelect(customer.id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer active:scale-[0.98] transition-all rounded-2xl border-2 group ${
                          isSelected 
                            ? 'border-rose-500 bg-white dark:bg-slate-900 shadow-md' 
                            : 'border-transparent bg-white dark:bg-slate-900 shadow-sm'
                        }`}
                      >
                        {/* Avatar Menor */}
                        <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-base transition-all ${
                          isSelected 
                            ? 'bg-rose-500 text-white scale-105' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {customer.name.charAt(0)}
                        </div>

                        {/* Info Compacta */}
                        <div className="flex-1 overflow-hidden">
                          <h4 className={`font-bold text-sm tracking-tight truncate ${isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                            {customer.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge color={getStatusColor(status)}>{status}</Badge>
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                              {formatPhone(customer.phone)}
                            </span>
                          </div>
                        </div>

                        {/* Ícone Minimalista */}
                        <div className={`transition-all ${isSelected ? 'text-rose-500' : 'text-slate-200 dark:text-slate-800'}`}>
                          {isSelected ? (
                            <CheckCircle2 size={20} strokeWidth={3} />
                          ) : (
                            <ChevronRight size={18} strokeWidth={2.5} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerSelector;
