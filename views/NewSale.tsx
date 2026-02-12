
import React, { useState, useMemo } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  CheckCircle2,
  Search
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { Customer, Product, SaleItem, View } from '../types';
import { useStore } from '../store/useStore';
import CustomerSelector from '../components/CustomerSelector';

interface NewSaleProps {
  customers: Customer[];
  products: Product[];
  createSale: (sale: any) => void;
  setView: (view: View) => void;
}

const CATEGORIES = ['Todos', 'Fragrâncias', 'Maquiagem', 'Cuidados com a Pele', 'Cabelo', 'Corpo e Banho'];

const NewSale: React.FC<NewSaleProps> = ({ customers, products, createSale, setView }) => {
  const { getCustomerStatus } = useStore();
  const [step, setStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | 'credit_card' | 'debit_card'>('pix');
  const [installments, setInstallments] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const total = useMemo(() => cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0), [cartItems]);

  // Função auxiliar para obter a quantidade de um produto específico no carrinho
  const getCartQuantity = (productId: string) => {
    return cartItems.find(item => item.productId === productId)?.quantity || 0;
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'Todos' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  const addToCart = (product: Product) => {
    const existing = cartItems.find(i => i.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return;
      setCartItems(cartItems.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (product.stock <= 0) return;
      setCartItems([...cartItems, { productId: product.id, quantity: 1, unitPrice: product.price }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = item.quantity + delta;
        if (newQty < 1 || (product && newQty > product.stock)) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleFinish = () => {
    createSale({
      customerId: selectedCustomerId,
      items: cartItems,
      total,
      paymentMethod,
      installments
    });
    setShowSuccess(true);
    setTimeout(() => {
      setView('dashboard');
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center gap-4">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold dark:text-slate-100">Venda Realizada!</h2>
        <p className="text-gray-500 dark:text-slate-400">O estoque foi atualizado e as parcelas geradas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Indicador de Passos */}
      <div className="flex justify-between items-center px-6 relative mt-2">
        <div className="absolute top-4 left-10 right-10 h-0.5 bg-slate-100 dark:bg-slate-800 -z-0"></div>
        {[1, 2, 3].map(s => (
          <div key={s} className="flex flex-col items-center gap-1 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
              step === s ? 'bg-rose-500 text-white ring-4 ring-rose-100 dark:ring-rose-900/30 scale-110 shadow-lg shadow-rose-200 dark:shadow-none' : 
              step > s ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
            }`}>
              {step > s ? <CheckCircle2 size={16} strokeWidth={3} /> : s}
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <CustomerSelector 
          customers={customers}
          selectedId={selectedCustomerId}
          onSelect={(id) => {
            setSelectedCustomerId(id);
            setTimeout(() => setStep(2), 300);
          }}
          onClose={() => setView('dashboard')}
          getStatus={getCustomerStatus}
          onAddCustomer={() => setView('add-customer')}
        />
      )}

      {/* Step 2: Product Selection */}
      {step === 2 && (
        <section className="flex flex-col gap-3 animate-fade-in">
          <div className="flex justify-between items-end px-1 mb-1">
            <div className="flex flex-col">
              <h3 className="text-lg font-black dark:text-slate-100 tracking-tight">Produtos</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Selecione o que ela comprou</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Parcial</span>
              <span className="text-rose-500 dark:text-rose-400 font-black text-xl leading-none">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Filtros por Categoria */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-mask">
            <div className="flex gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black transition-all whitespace-nowrap border capitalize tracking-tight ${
                    filterCategory === cat 
                      ? 'bg-rose-500 border-rose-500 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Busca Rápida */}
          <div className="relative group px-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={14} />
            <input
              placeholder="Pesquisar por nome..."
              className="w-full bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-rose-300 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[38vh] overflow-y-auto pr-1 beauty-scroll">
            {filteredProducts.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs italic">Nenhum produto encontrado nesta categoria.</div>
            ) : (
              filteredProducts.map(p => {
                const inCart = getCartQuantity(p.id);
                const availableStock = p.stock - inCart;
                
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-transform">
                    <div className="flex-1 overflow-hidden pr-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        {p.category} • <span className={availableStock <= p.minStock ? 'text-amber-500' : ''}>{availableStock} un.</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black text-rose-500 pr-1">{formatCurrency(p.price)}</span>
                      <button 
                        disabled={availableStock <= 0}
                        onClick={() => addToCart(p)}
                        className={`p-2 rounded-lg active:scale-90 shadow-sm transition-all ${
                          availableStock <= 0 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700' 
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col gap-2 mt-2 bg-slate-50 dark:bg-slate-900/20 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sacola ({cartItems.length})</h4>
              {cartItems.length > 0 && <button onClick={() => setCartItems([])} className="text-[9px] font-black text-rose-400 underline uppercase tracking-widest">Limpar Tudo</button>}
            </div>
            
            {cartItems.length === 0 ? (
              <div className="py-4 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                <ShoppingCart size={24} strokeWidth={1.5} className="opacity-50" />
                <p className="text-[9px] font-bold mt-1 uppercase tracking-wider opacity-50">Sua sacola está vazia</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[20vh] overflow-y-auto beauty-scroll">
                {cartItems.map(item => {
                  const p = products.find(prod => prod.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[11px] font-bold dark:text-slate-200 truncate">{p?.name}</p>
                        <p className="text-[10px] text-rose-500 font-black">{formatCurrency(item.unitPrice * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 text-slate-400 active:text-rose-500"><Minus size={12} /></button>
                        <span className="font-bold text-[10px] w-3 text-center dark:text-slate-200">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 text-slate-400 active:text-rose-500"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="p-1.5 text-rose-300 active:text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <Button variant="secondary" onClick={() => setStep(1)} className="px-5 h-12"><ArrowLeft size={18} /></Button>
            <Button fullWidth disabled={cartItems.length === 0} onClick={() => setStep(3)} className="h-12 text-sm font-black tracking-tight">
              Revisar Pagamento
            </Button>
          </div>
        </section>
      )}

      {/* Step 3: Payment & Installments */}
      {step === 3 && (
        <section className="flex flex-col gap-5 animate-fade-in">
          <div className="flex flex-col gap-1 px-1">
            <h3 className="text-2xl font-bold dark:text-slate-100">Finalizar Venda</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Como ela irá pagar?</p>
          </div>
          
          <Card className="flex flex-col gap-4 border-2 border-rose-50 dark:border-rose-900/20 shadow-xl shadow-rose-100/20 dark:shadow-none">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Método</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {id: 'pix', label: 'PIX'}, 
                    {id: 'cash', label: 'Dinheiro'},
                    {id: 'credit_card', label: 'Crédito'},
                    {id: 'debit_card', label: 'Débito'}
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                        paymentMethod === method.id 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Parcelas</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                    <button
                      key={n}
                      onClick={() => setInstallments(n)}
                      className={`py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                        installments === n 
                          ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                      }`}
                    >
                      {n === 1 ? 'À vista' : `${n}x`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 dark:bg-[#1e293b] border-none text-white p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <div className="flex flex-col">
                <span className="text-xs text-white/50 font-bold uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black">{formatCurrency(total)}</span>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl">
                <ShoppingCart className="text-rose-400" />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Plano</span>
                <span className="text-sm font-bold text-rose-300">
                  {installments === 1 ? 'Pagamento único' : `${installments}x de ${formatCurrency(total / installments)}`}
                </span>
              </div>
              <Badge color="rose">Revisado</Badge>
            </div>
          </Card>

          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => setStep(2)} className="px-6"><ArrowLeft size={18} /></Button>
            <Button fullWidth variant="primary" onClick={handleFinish} className="py-4 text-lg font-black tracking-tight">
              Finalizar Venda
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default NewSale;
