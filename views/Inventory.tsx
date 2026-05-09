
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
  Bath,
  Edit2
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
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  
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

  const toggleExpand = useCallback((id: string) => {
    setExpandedProductId(prev => prev === id ? null : id);
  }, []);

  const handleDeleteQuick = useCallback((product: Product) => {
    if (window.confirm(`Tem certeza que deseja remover "${product.name}" do estoque?`)) {
      deleteProduct(product.id);
      setExpandedProductId(null);
      if (editingProduct?.id === product.id) {
        closeForm();
      }
    }
  }, [deleteProduct, editingProduct, closeForm]);

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

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.icon ?? <Sparkles size={18} />;
  };

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
    <div className="flex flex-col gap-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="relative flex-1 min-w-0">
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
          className="bg-rose-500 text-white p-3 rounded-2xl shadow-sm active:scale-95 transition-all shrink-0"
        >
          <PackagePlus size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-mask w-full min-w-0">
        <div className="flex gap-2">
          <FilterChip label="Todos" />
          {CATEGORIES.map(cat => (
            <FilterChip key={cat.value} label={cat.label} />
          ))}
        </div>
      </div>

      {showForm && (
        <Card className="flex flex-col gap-4 relative border-2 border-rose-100 dark:border-rose-900 shadow-xl animate-fade-in ring-4 ring-rose-50/50 dark:ring-rose-950/20">
          <button 
            onClick={closeForm} 
            className="absolute right-4 top-4 text-gray-300 dark:text-slate-600 hover:text-gray-500 p-1 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-xl text-rose-600 dark:text-rose-400 tracking-tight">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
            <div className="h-1 w-12 bg-rose-200 dark:bg-rose-800 rounded-full"></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            <Input 
              label="Nome do Produto" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="Ex: Perfume Malbec 100ml" 
              autoFocus={!editingProduct}
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
            
            <Button type="submit" className="py-4 text-lg">
              {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
            </Button>
          </form>
        </Card>
      )}

      <div className="flex flex-col gap-6 w-full min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pb-8 w-full min-w-0">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 dark:text-slate-600 italic">
              {searchTerm ? `Nenhum produto com "${searchTerm}"` : 'Nenhum produto corresponde aos filtros.'}
            </div>
          ) : (
            filtered.map(product => {
              const isExpanded = expandedProductId === product.id;
              
              return (
                <Card 
                  key={product.id} 
                  className={`flex flex-col gap-0 p-0 overflow-hidden transition-all duration-300 border ${
                    isExpanded 
                      ? 'border-rose-100 dark:border-rose-900 shadow-lg bg-white dark:bg-[#111827]' 
                      : 'border-gray-50 dark:border-slate-900 bg-white dark:bg-[#0f172a]'
                  }`}
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer active:bg-gray-50 dark:active:bg-slate-800/50 transition-colors"
                    onClick={() => toggleExpand(product.id)}
                  >
                    <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                      {getCategoryIcon(product.category)}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-gray-800 dark:text-slate-100 truncate">{product.name}</h4>
                        <span className="font-black text-rose-500 dark:text-rose-400 text-sm shrink-0">{formatCurrency(product.price)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider truncate">{product.category}</p>
                        <span className={`text-[10px] font-bold shrink-0 ${product.stock <= product.minStock ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>
                          Qtd: {product.stock}
                        </span>
                      </div>
                      {product.stock <= product.minStock && (
                        <div className="mt-1 flex items-center gap-1 text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md w-fit border border-amber-100/50 dark:border-amber-800/50">
                          <AlertCircle size={10} />
                          ESTOQUE BAIXO
                        </div>
                      )}
                    </div>

                    <div className={`text-gray-300 dark:text-slate-700 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-90 text-rose-500' : ''}`}>
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
                            onClick={(e) => { e.stopPropagation(); setEditingProduct(product); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                          >
                            <Edit2 size={18} /> Editar Produto
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteQuick(product); }}
                            title="Excluir"
                            className="w-14 h-12 flex items-center justify-center bg-white dark:bg-[#1f2937] border border-rose-100 dark:border-rose-900/50 text-rose-500 dark:text-rose-400 rounded-xl active:scale-95 transition-all group"
                          >
                            <Trash2 size={18} className="group-active:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(Inventory);
