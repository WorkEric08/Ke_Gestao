
import React, { useState, useMemo } from 'react';
import { Card, Badge, Input } from '../components/UI';
import { AlertTriangle, Calendar, Phone, CheckCircle2, User, ArrowRight, Search, X, Filter } from 'lucide-react';
import { Installment, Customer, Sale, Product } from '../types';
import { formatCurrency, formatDate, formatPhone } from '../utils/format';

interface DebtorsProps {
  installments: Installment[];
  customers: Customer[];
  sales: Sale[];
  products: Product[];
  markPaid: (id: string) => void;
}

const Debtors: React.FC<DebtorsProps> = ({ installments, customers, sales, products, markPaid }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');

  // Extrair meses únicos que possuem parcelas pendentes para o filtro
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    installments
      .filter(ins => !ins.paidAt)
      .forEach(ins => {
        const date = new Date(ins.dueDate);
        const monthLabel = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
        months.add(monthLabel);
      });
    return Array.from(months).sort((a, b) => {
      return 0; 
    });
  }, [installments]);

  const filteredPending = useMemo(() => {
    return installments
      .filter(ins => {
        if (ins.paidAt) return false;
        
        const sale = sales.find(s => s.id === ins.saleId);
        const customer = customers.find(c => c.id === sale?.customerId);
        
        // Filtro por Cliente
        const matchesSearch = !searchTerm || 
          customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
          
        // Filtro por Mês
        const date = new Date(ins.dueDate);
        const monthLabel = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
        const matchesMonth = selectedMonth === 'todos' || monthLabel === selectedMonth;
        
        return matchesSearch && matchesMonth;
      })
      .sort((a, b) => a.dueDate - b.dueDate);
  }, [installments, searchTerm, selectedMonth, sales, customers]);

  const getOverdueStatus = (dueDate: number) => {
    const today = new Date().setHours(0, 0, 0, 0);
    if (dueDate < today) return 'vencida';
    return 'pendente';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMonth('todos');
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="px-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-xl font-bold dark:text-slate-100 leading-tight">Contas a Receber</h2>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">
          Gerencie os pagamentos pendentes e filtre por cliente ou mês.
        </p>
      </section>

      {/* Seção de Filtros */}
      <div className="flex flex-col gap-3 px-1">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={16} />
          <input
            placeholder="Filtrar por nome do cliente..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 p-1">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-mask">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMonth('todos')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border uppercase tracking-tight whitespace-nowrap ${
                selectedMonth === 'todos' 
                  ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none' 
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600'
              }`}
            >
              Todos
            </button>
            {availableMonths.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border uppercase tracking-tight whitespace-nowrap ${
                  selectedMonth === month 
                    ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredPending.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in text-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-full scale-150 opacity-50"></div>
            <div className="relative w-16 h-16 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 rounded-full flex items-center justify-center">
              <Filter size={32} />
            </div>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">Nenhuma conta encontrada</h3>
            <p className="text-xs text-gray-500 dark:text-slate-500 max-w-[200px] mt-1">
              {searchTerm || selectedMonth !== 'todos' 
                ? 'Tente ajustar os filtros de busca para encontrar o que procura.'
                : 'Você não possui recebimentos pendentes no momento.'
              }
            </p>
          </div>
          {(searchTerm || selectedMonth !== 'todos') && (
            <button 
              onClick={clearFilters}
              className="text-rose-500 text-xs font-bold uppercase tracking-widest underline underline-offset-4"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest">
              Mostrando {filteredPending.length} {filteredPending.length === 1 ? 'pendência' : 'pendências'}
            </span>
          </div>
          
          {filteredPending.map(ins => {
            const sale = sales.find(s => s.id === ins.saleId);
            const customer = customers.find(c => c.id === sale?.customerId);
            const status = getOverdueStatus(ins.dueDate);
            
            return (
              <Card 
                key={ins.id} 
                className={`group flex flex-col gap-3 p-4 transition-all active:scale-[0.98] border-l-4 shadow-sm ${
                  status === 'vencida' ? 'border-l-rose-500 dark:border-l-rose-600' : 'border-l-amber-500 dark:border-l-amber-600'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 overflow-hidden">
                    <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                      <User size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-tight truncate text-sm">
                        {customer?.name || 'Cliente'}
                      </h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 font-bold">
                        <Phone size={9} /> {formatPhone(customer?.phone || '')}
                      </p>
                    </div>
                  </div>
                  <Badge color={status === 'vencida' ? 'rose' : 'amber'}>
                    {status === 'vencida' ? 'Vencida' : 'Pendente'}
                  </Badge>
                </div>

                <div className="flex items-end justify-between bg-slate-50/50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={9} /> Vencimento
                    </span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                      {formatDate(ins.dueDate)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest block mb-0.5">Valor da Parcela</span>
                    <span className={`text-lg font-black ${status === 'vencida' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                      {formatCurrency(ins.amount)}
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.15em]">
                    Parcela {ins.number}/{sale?.installments}
                  </span>
                  <button 
                    onClick={() => markPaid(ins.id)}
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-wider active:scale-95 transition-all border border-emerald-100/50 dark:border-emerald-800/50"
                  >
                    Confirmar Recebimento <ArrowRight size={14} strokeWidth={3} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Debtors;
