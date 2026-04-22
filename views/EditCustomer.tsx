
import React, { useState, memo, useCallback } from 'react';
import { Card, Input, Button } from '../components/UI';
import { User, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Customer, View } from '../types';
import { formatPhone } from '../utils/format';

interface EditCustomerProps {
  customer: Customer;
  updateCustomer: (id: string, updates: any) => void;
  setView: (view: View) => void;
}

const EditCustomer: React.FC<EditCustomerProps> = ({ customer, updateCustomer, setView }) => {
  const [formData, setFormData] = useState({
    name: customer.name,
    phone: formatPhone(customer.phone)
  });
  const [isSaved, setIsSaved] = useState(false);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    let digits = rawValue.replace(/\D/g, '');
    
    // Remove +55 se presente
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.slice(2);
    }
    
    /**
     * LÓGICA SMART AUTO-9
     * Se detectar 10 dígitos (DDD + 8 números), injetamos o 9 automaticamente.
     */
    if (digits.length === 10) {
      digits = digits.slice(0, 2) + '9' + digits.slice(2);
    }
    
    // Limita a 11 dígitos
    digits = digits.slice(0, 11);
    
    // Reaplica máscara progressiva
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
    
    setFormData(prev => ({ ...prev, phone: formatted }));
  }, []);

  const handleSave = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    
    updateCustomer(customer.id, {
      name: formData.name,
      phone: formData.phone.replace(/\D/g, '') 
    });
    
    setIsSaved(true);
    setTimeout(() => {
      setView('customers');
    }, 1200);
  }, [formData, customer.id, updateCustomer, setView]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setView('customers')}
          className="p-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-gray-500 dark:text-slate-400 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold dark:text-slate-100 leading-tight">Editar Cliente</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            Atualize as informações de {customer.name.split(' ')[0]}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center">
          <User size={40} />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest px-1">Dados Cadastrais</h3>
        <Card className="flex flex-col gap-5">
          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <Input 
              label="Nome do Cliente" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="Ex: Maria Silva" 
            />
            <Input 
              label="WhatsApp" 
              value={formData.phone} 
              onChange={handlePhoneChange} 
              placeholder="(00) 90000-0000" 
              type="tel" 
              inputMode="tel"
            />
            
            <div className="pt-2">
              <Button 
                type="submit"
                variant={isSaved ? "secondary" : "primary"} 
                fullWidth 
                className={isSaved ? "text-emerald-500 dark:text-emerald-400" : "py-4"}
                disabled={isSaved}
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 size={20} /> Alterações Salvas
                  </>
                ) : (
                  <>
                    <Save size={20} /> Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
};

export default memo(EditCustomer);
