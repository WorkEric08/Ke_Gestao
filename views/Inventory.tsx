
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Card, Input, Button, Badge, Select } from '../components/UI';
import {
  Search,
  PackagePlus,
  AlertCircle,
  X,
  Trash2,
  ChevronRight,
  Sparkles,
  Palette,
  Droplets,
  Scissors,
  Bath,
  Edit2,
  Package
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
  { label: 'Fragrâncias', value: 'Fragrâncias', icon: <Sparkles size={16} /> },
  { label: 'Maquiagem', value: 'Maquiagem', icon: <Palette size={16} /> },
  { label: 'Cuidados com a Pele', value: 'Cuidados com a Pele', icon: <Droplets size={16} /> },
  { label: 'Cabelo', value: 'Cabelo', icon: <Scissors size={16} /> },
  { label: 'Corpo e Banho', value: 'Corpo e Banho', icon: <Bath size={16} /> }
];

const FilterChip = memo<{ label: string; active: boolean; icon?: React.ReactNode; onSelect: (label: string) => void }>(
  ({ label, active, icon, onSelect }) => (
    <button
      type="button"
      onClick={() => onSelect(label)}
      aria-pressed={active}
      className={`flex items-center gap-1.5 px-3.5 min-h-10 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
        active
          ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200 dark:shadow-none'
          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400'
      }`}
    >
      {icon && <span className={active ? 'text-white' : 'text-rose-400 dark:text-rose-600'}>{icon}</span>}
      {label}
    </button>
  )
);

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
      if (editingProduct?.id === product.id) closeForm();
    }
  }, [deleteProduct, editingProduct, closeForm]);

  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, price: maskCurrency(e.target.value) }));
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
    return cat?.icon ?? <Sparkles size={16} />;
  };

  const getStockPercent = (product: Product) => {
    const max = Math.max(product.minStock * 3, product.stock, 1);
    return Math.min((product.stock / max) * 100, 100);
  };

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 overflow-x-hidden">

      {/* Search + add */}
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={17} />
          <input
            placeholder="Buscar produto..."
            aria-label="Buscar produto"
            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-100 rounded-2xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setIsAdding(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          aria-label="Novo produto"
          className="bg-rose-500 text-white p-3 rounded-2xl shadow-sm shadow-rose-200 dark:shadow-none active:scale-95 transition-all shrink-0 flex items-center gap-2"
        >
          <PackagePlus size={20} />
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-mask w-full min-w-0">
        <div className="flex gap-2">
          <FilterChip label="Todos" icon={<Package size={13} />} active={filterCategory === 'Todos'} onSelect={setFilterCategory} />
          {CATEGORIES.map(cat => (
            <FilterChip key={cat.value} label={cat.label} icon={cat.icon} active={filterCategory === cat.value} onSelect={setFilterCategory} />
          ))}
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <Card className="flex flex-col gap-4 relative border-2 border-rose-100 dark:border-rose-900/60 shadow-xl animate-fade-in">
          <button
            onClick={closeForm}
            aria-label="Fechar formulário"
            className="absolute right-2 top-2 text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 w-11 h-11 flex items-center justify-center transition-colors rounded-lg"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center shrink-0">
              <Package size={18} className="text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-slate-100 leading-tight">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {editingProduct ? 'Atualize as informações abaixo' : 'Preencha os dados do produto'}
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-slate-800" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <div className="grid grid-cols-2 gap-3">
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
              label="Mínimo para Alerta de Estoque Baixo"
              type="number"
              value={form.minStock}
              onChange={e => setForm({...form, minStock: e.target.value})}
              placeholder="2"
            />

            <div className="flex gap-3 pt-1">
              {editingProduct && (
                <button
                  type="button"
                  aria-label="Remover produto"
                  onClick={() => {
                    if (window.confirm(`Remover "${editingProduct.name}"?`)) {
                      deleteProduct(editingProduct.id);
                      closeForm();
                    }
                  }}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl border border-rose-100 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/10 text-rose-500 active:scale-95 transition-all shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <Button type="submit" className="flex-1 py-3.5">
                {editingProduct ? 'Salvar Alterações' : 'Adicionar Produto'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Product list */}
      <div className="flex flex-col gap-2.5 pb-8 w-full min-w-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
              <Package size={28} className="text-gray-300 dark:text-slate-600" />
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-400 dark:text-slate-500">
                {searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum produto encontrado'}
              </p>
              <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">
                {!searchTerm && filterCategory === 'Todos' ? 'Adicione seu primeiro produto acima' : 'Tente outro filtro ou busca'}
              </p>
            </div>
          </div>
        ) : (
          filtered.map(product => {
            const isExpanded = expandedProductId === product.id;
            const isLow = product.stock <= product.minStock;
            const stockPct = getStockPercent(product);

            return (
              <div
                key={product.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? 'border-rose-200 dark:border-rose-800/60 shadow-lg'
                    : 'border-gray-100 dark:border-slate-800 shadow-sm'
                }`}
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-3.5 p-4 cursor-pointer active:bg-gray-50 dark:active:bg-slate-800/40 transition-colors"
                  onClick={() => toggleExpand(product.id)}
                  aria-expanded={isExpanded}
                >
                  {/* Category icon */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                    isExpanded
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400'
                  }`}>
                    {getCategoryIcon(product.category)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-slate-100 truncate text-sm leading-tight">{product.name}</h4>
                      <span className="font-black text-rose-500 dark:text-rose-400 text-sm shrink-0 tabular-nums">{formatCurrency(product.price)}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-wide mt-0.5 truncate">{product.category}</p>

                    {/* Stock bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isLow ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${stockPct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-black shrink-0 tabular-nums ${isLow ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>
                        {product.stock} un.
                      </span>
                    </div>

                    {isLow && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-800/40">
                        <AlertCircle size={9} />
                        ESTOQUE BAIXO
                      </div>
                    )}
                  </div>

                  <div className={`text-gray-300 dark:text-slate-700 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90 text-rose-400' : ''}`}>
                    <ChevronRight size={18} />
                  </div>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-800/60 pt-3 animate-fade-in">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all"
                      >
                        <Edit2 size={16} /> Editar
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuick(product); }}
                        aria-label={`Remover ${product.name}`}
                        className="w-12 flex items-center justify-center bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/40 text-rose-500 rounded-2xl active:scale-95 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default memo(Inventory);
