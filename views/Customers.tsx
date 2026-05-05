
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Card, Input, Button, Badge } from '../components/UI';
import { Search, UserPlus, Phone, ChevronRight, X, MessageCircle, Edit2, Trash2 } from 'lucide-react';
import { formatPhone } from '../utils/format';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  addCustomer: (c: any) => void;
  deleteCustomer: (id: string) => void;
  getStatus: (id: string) => string;
  onEdit: (id: string) => void;
  initialIsAdding?: boolean;
}

type FilterStatus = 'todos' | 'em dia' | 'pendente' | 'devedor';

const Customers: React.FC<CustomersProps> = ({ customers, addCustomer, deleteCustomer, getStatus, onEdit, initialIsAdding = false }) => {
  const [isAdding, setIsAdding] = useState(initialIsAdding);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  useEffect(() => {
    if (initialIsAdding) setIsAdding(true);
  }, [initialIsAdding]);

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

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let digits = rawValue.replace(/\D/g, '');
    
    // Remove DDI +55 se presente (comum ao copiar de contatos)
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.slice(2);
    }

    /**
     * LÓGICA SMART AUTO-9 (Aprimorada)
     * Se o número detectado tem 10 dígitos (DDD + 8 números), 
     * injetamos o '9' imediatamente após o DDD.
     */
    if (digits.length === 10) {
      digits = digits.slice(0, 2) + '9' + digits.slice(2);
    }
    
    // Limita ao máximo de 11 dígitos (Padrão Celular BR)
    digits = digits.slice(0, 11);
    
    // Aplica máscara visual progressiva: (XX) XXXXX-XXXX
    let formatted = '';
    if (digits.length > 0) {
      formatted = `(${digits.slice(0, 2)}`;
      if (digits.length > 2) {
        formatted += `) ${digits.slice(2, 7)}`;
        if (digits.length > 7) {
          formatted += `-${digits.slice(7, 11)}`;
        }
      }
    }
    setNewPhone(formatted);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    addCustomer({ 
      name: newName, 
      phone: newPhone.replace(/\D/g, '') 
    });
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  }, [newName, newPhone, addCustomer]);

  const handleDelete = useCallback((id: string, name: string) => {
    if (window.confirm(`Deseja excluir permanentemente o cliente "${name}"?`)) {
      deleteCustomer(id);
      setExpandedCustomerId(null);
    }
  }, [deleteCustomer]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'devedor': return 'rose';
      case 'pendente': return 'amber';
      case 'em dia': return 'emerald';
      default: return 'gray';
    }
  };

  const FilterChip = ({ status, label }: { status: FilterStatus, label: string }) => (
    <button
      onClick={() => setFilterStatus(status)}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
        filterStatus === status 
          ? 'bg-rose-500 border-rose-500 text-white shadow-sm' 
          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400'
      }`}
    >
      {label}
    </button>
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedCustomerId(prev => prev === id ? null : id);
  }, []);

  const openWhatsApp = useCallback((phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleaned}`;
    window.open(url, '_blank');
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
          <input
            placeholder="Buscar por letra ou nome..."
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-100 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-rose-500 text-white p-3 rounded-2xl shadow-sm active:scale-95 transition-all"
        >
          <UserPlus size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-mask">
        <div className="flex gap-2">
          <FilterChip status="todos" label="Todos" />
          <FilterChip status="em dia" label="Em Dia" />
          <FilterChip status="pendente" label="Pendente" />
          <FilterChip status="devedor" label="Devedor" />
        </div>
      </div>

      {isAdding && (
        <Card className="flex flex-col gap-4 relative border-2 border-rose-100 dark:border-rose-900 shadow-xl animate-fade-in ring-4 ring-rose-50/50 dark:ring-rose-950/20">
          <button 
            onClick={() => setIsAdding(false)} 
            className="absolute right-4 top-4 text-gray-300 dark:text-slate-600 hover:text-gray-500 p-1 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-xl text-rose-600 dark:text-rose-400 tracking-tight">Novo Cliente</h3>
            <div className="h-1 w-12 bg-rose-200 dark:bg-rose-800 rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <Input 
              label="Nome Completo" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Ex: Maria Silva" 
              autoFocus 
            />
            <Input 
              label="WhatsApp" 
              value={newPhone} 
              onChange={handlePhoneChange} 
              placeholder="(00) 90000-0000" 
              type="tel" 
              inputMode="tel"
            />
            <Button type="submit" className="py-4 text-lg">Cadastrar Cliente</Button>
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        {Object.keys(groupedCustomers).length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-slate-600 italic">
            {searchTerm ? `Nenhum cliente com "${searchTerm}"` : 'Nenhum cliente encontrado.'}
          </div>
        ) : (
          Object.keys(groupedCustomers).sort().map(letter => (
            <div key={letter} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <span className="text-sm font-black text-rose-500/40 dark:text-rose-400/20 uppercase tracking-tighter">{letter}</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-slate-900"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {groupedCustomers[letter].map(customer => {
                  const status = getStatus(customer.id);
                  const isExpanded = expandedCustomerId === customer.id;
                  
                  return (
                    <Card 
                      key={customer.id} 
                      className={`flex flex-col gap-0 p-0 overflow-hidden transition-all duration-300 border ${
                        isExpanded 
                          ? 'border-rose-100 dark:border-rose-900 shadow-lg bg-white dark:bg-[#111827]' 
                          : 'border-gray-50 dark:border-slate-900 bg-white dark:bg-[#0f172a]'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-4 p-4 cursor-pointer active:bg-gray-50 dark:active:bg-slate-800/50 transition-colors"
                        onClick={() => toggleExpand(customer.id)}
                      >
                        <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-2xl flex items-center justify-center font-bold text-lg">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-gray-800 dark:text-slate-200 truncate">{customer.name}</h4>
                            <Badge color={getStatusColor(status)}>{status}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400 dark:text-slate-500 text-xs mt-1 font-medium">
                            <Phone size={12} className="opacity-70" />
                            <span>{formatPhone(customer.phone)}</span>
                          </div>
                        </div>
                        <div className={`text-gray-300 dark:text-slate-700 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-rose-500' : ''}`}>
                          <ChevronRight size={20} />
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="bg-gray-50/50 dark:bg-[#0b0f19] px-4 pb-4 pt-3 border-t border-gray-100 dark:border-slate-800/50 animate-fade-in">
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest px-1">
                              <span>Ações Rápidas</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openWhatsApp(customer.phone)}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                              >
                                <MessageCircle size={18} fill="currentColor" /> WhatsApp
                              </button>
                              
                              <button 
                                onClick={() => onEdit(customer.id)}
                                title="Editar"
                                className="w-14 h-11 flex items-center justify-center bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-xl active:scale-95 transition-all"
                              >
                                <Edit2 size={18} />
                              </button>

                              <button 
                                onClick={() => handleDelete(customer.id, customer.name)}
                                title="Excluir"
                                className="w-14 h-11 flex items-center justify-center bg-white dark:bg-[#1f2937] border border-rose-100 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 rounded-xl active:scale-95 transition-all group"
                              >
                                <Trash2 size={18} className="group-active:scale-110 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default memo(Customers);
