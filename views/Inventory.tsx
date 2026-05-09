
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Card, Input, Button, Badge, Select } from '../components/UI';
import { 
  Search, 
  PackagePlus, 
  AlertCircle, 
  X, 
  Trash2, 
  Save, 
  ArrowLeft, 
  ChevronRight,
  Sparkles,
  Palette,
  Droplets,
  Scissors,
  Bath
} from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';

interface InventoryProps {
  products: Product[];
  addProduct: (p: any) => void;
  updateProduct: (id: string, updates: any) => void;
  deleteProduct: (id: string) => void;
  initialIsAdding?: boolean;
}

const CATEGORIES = [
  { label: 'Fragrâncias', value: 'Fragrâncias', icon: <Sparkles size={18} /> },
  { label: 'Maquiagem', value: 'Maquiagem', icon: <Palette size={18} /> },
  { label: 'Cuidados com a Pele', value: 'Cuidados com a Pele', icon: <Droplets size={18} /> },
  { label: 'Cabelo', value: 'Cabelo', icon: <Scissors size={18} /> },
  { label: 'Corpo e Banho', value: 'Corpo e Banho', icon: <Bath size={18} /> }
];

const Inventory: React.FC<InventoryProps> = ({ 
  products, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  initialIsAdding = false 
}) => {
  const [isAdding, setIsAdding] = useState(initialIsAdding);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  
  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0].value,
    price: '',
    stock: '',
    minStock: '2'
  });

  const maskCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const amount = parseInt(digits, 10) / 100;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const parseCurrencyToFloat = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
  };

  const showForm = isAdding || !!editingProduct;

  useEffect(() => {
    if (initialIsAdding) setIsAdding(true);
  }, [initialIsAdding]);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        category: editingProduct.category,
        price: maskCurrency((editingProduct.price * 100).toFixed(0)),
        stock: editingProduct.stock.toString(),
        minStock: editingProduct.minStock.toString()
      });
      setIsAdding(false);
    }
  }, [editingProduct]);

  const closeForm = useCallback(() => {
    setIsAdding(false);
    setEditingProduct(null);
    setForm({ name: '', category: CATEGORIES[0].value, price: '', stock: '', minStock: '2' });
  }, []);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = maskCurrency(e.target.value);
    setForm(prev => ({ ...prev, price: maskedValue }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) return;

    const productData = {
      name: form.name,
      category: form.category,
      price: parseCurrencyToFloat(form.price),
      stock: parseInt(form.stock),
      minStock: parseInt(form.minStock)
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }

    closeForm();
  }, [form, editingProduct, addProduct, updateProduct, closeForm]);

  const handleDelete = useCallback(() => {
    if (!editingProduct) return;
    if (window.confirm(`Tem certeza que deseja remover "${editingProduct.name}" do estoque?`)) {
      deleteProduct(editingProduct.id);
      closeForm();
    }
  }, [editingProduct, deleteProduct, closeForm]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => {
      if (term && !p.name.toLowerCase().includes(term)) return false;
      if (filterCategory !== 'Todos' && p.category !== filterCategory) return false;
      return true;
    });
  }, [products, searchTerm, filterCategory]);

  const FilterChip: React.FC<{ label: string }> = ({ label }) => (
    <button
      onClick={() => setFilterCategory(label)}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
        filterCategory === label
          ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4">

      {!showForm && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
              <input
                placeholder="Buscar produto..."
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-100 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-rose-500 text-white p-3 rounded-2xl shadow-sm active:scale-95 transition-all"
            >
              <PackagePlus size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-mask">
            <div className="flex gap-2">
              <FilterChip label="Todos" />
              {CATEGORIES.map(cat => (
                <FilterChip key={cat.value} label={cat.label} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-8">
            {filtered.length === 0 ? (
              <div className="col-span-full py-20 text-center text-gray-400 dark:text-slate-600 italic animate-fade-in flex flex-col items-center gap-3">
                <Search size={32} className="opacity-10" />
                <span>Nenhum produto corresponde aos filtros.</span>
              </div>
            ) : (
              filtered.map(product => (
                <Card 
                  key={product.id} 
                  className="flex items-center gap-4 p-4 relative active:scale-[0.98] transition-all bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-slate-800 cursor-pointer group shadow-none hover:shadow-md hover:border-rose-100 dark:hover:border-rose-900/30"
                  onClick={() => setEditingProduct(product)}
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 pr-2 overflow-hidden">
                        <h4 className="font-bold text-gray-800 dark:text-slate-100 truncate group-hover:text-rose-500 transition-colors">{product.name}</h4>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">{product.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block font-black text-rose-500 dark:text-rose-400 text-sm leading-none">{formatCurrency(product.price)}</span>
                        <span className={`text-[10px] font-bold mt-1 block ${product.stock <= product.minStock ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>
                          Qtd: {product.stock}
                        </span>
                      </div>
                    </div>
                    
                    {product.stock <= product.minStock && (
                      <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md w-fit border border-amber-100/50 dark:border-amber-800/50">
                        <AlertCircle size={10} />
                        ESTOQUE BAIXO
                      </div>
                    )}
                  </div>

                  <div className="text-gray-300 dark:text-slate-700 group-hover:text-rose-500 transition-colors shrink-0">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="flex flex-col gap-6 animate-fade-in pb-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={closeForm}
              className="p-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl text-gray-500 dark:text-slate-400 active:scale-90 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold dark:text-slate-100 leading-tight">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {editingProduct ? 'Altere as propriedades do item' : 'Adicione itens ao seu catálogo'}
              </p>
            </div>
          </div>

          <Card className="flex flex-col gap-5 border-2 border-rose-100 dark:border-rose-900/40 shadow-xl shadow-rose-100/20 dark:shadow-none bg-white dark:bg-slate-900">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input 
                label="Nome do Produto" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="Ex: Perfume Malbec 100ml" 
              />
              
              <Select 
                label="Categoria" 
                value={form.category} 
                onChange={val => setForm({...form, category: val})}
                options={CATEGORIES}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Preço (R$)" 
                  type="text"
                  inputMode="numeric"
                  value={form.price} 
                  onChange={handlePriceChange} 
                  placeholder="0,00" 
                />
                <Input 
                  label="Qtd em Estoque" 
                  type="number" 
                  value={form.stock} 
                  onChange={e => setForm({...form, stock: e.target.value})} 
                  placeholder="0" 
                />
              </div>

              <Input 
                label="Mínimo para Alerta" 
                type="number" 
                value={form.minStock} 
                onChange={e => setForm({...form, minStock: e.target.value})} 
              />
              
              <div className="flex flex-col gap-3 pt-3">
                <Button type="submit" fullWidth className="py-4 text-lg font-black tracking-tight">
                  <Save size={20} /> {editingProduct ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
                </Button>
                
                {editingProduct && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="w-full py-3.5 text-rose-500 dark:text-rose-400 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-2xl transition-all mt-1 border border-rose-100 dark:border-rose-900/30"
                  >
                    <Trash2 size={16} /> Remover Produto do Catálogo
                  </button>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default memo(Inventory);
