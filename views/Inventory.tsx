import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Input, Select } from '../components/UI';
import { Icon, IconName } from '../components/Icon';
import { AppBarButton, useAppBarActions } from '../components/AppBar';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';

interface InventoryProps {
  products: Product[];
  addProduct: (p: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  initialIsAdding?: boolean;
}

const CATEGORIES: { label: string; value: string; icon: IconName }[] = [
  { label: 'Fragrâncias', value: 'Fragrâncias', icon: 'fragrance' },
  { label: 'Maquiagem', value: 'Maquiagem', icon: 'makeup' },
  { label: 'Cuidados com a Pele', value: 'Cuidados com a Pele', icon: 'drop' },
  { label: 'Cabelo', value: 'Cabelo', icon: 'scissors' },
  { label: 'Corpo e Banho', value: 'Corpo e Banho', icon: 'drop' }
];

const SELECT_OPTIONS = CATEGORIES.map(c => ({ label: c.label, value: c.value, icon: <Icon name={c.icon} size={18} /> }));

const categoryIcon = (category: string): IconName =>
  CATEGORIES.find(c => c.value === category)?.icon ?? 'fragrance';

const stockPercent = (p: Product) => {
  const max = Math.max(p.minStock * 3, p.stock, 1);
  return Math.min((p.stock / max) * 100, 100);
};

const isLow = (p: Product) => p.stock <= p.minStock;

const maskCurrency = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseInt(digits, 10) / 100);
};

const parseCurrencyToFloat = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(/\./g, '').replace(',', '.'));
};

const FilterChip = memo<{ label: string; active: boolean; onSelect: (label: string) => void }>(({ label, active, onSelect }) => (
  <button
    type="button"
    onClick={() => onSelect(label)}
    aria-pressed={active}
    className={`relative shrink-0 h-8 rounded-lg inline-flex items-center gap-2 text-sm leading-5 font-medium whitespace-nowrap before:content-[''] before:absolute before:inset-x-0 before:-inset-y-2.5 ${
      active
        ? 'pl-2 pr-3 bg-secondary-container text-on-secondary-container'
        : 'px-4 border border-outline text-on-surface-variant'
    }`}
  >
    {active && <Icon name="check" size={18} />}
    {label}
  </button>
));

const Inventory: React.FC<InventoryProps> = ({ products, addProduct, updateProduct, deleteProduct, initialIsAdding = false }) => {
  const [isAdding, setIsAdding] = useState(initialIsAdding);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', category: CATEGORIES[0].value, price: '', stock: '', minStock: '2' });

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

  const openForm = useCallback(() => {
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterCategory('Todos');
  }, []);

  const barActions = useMemo(() => (
    <AppBarButton label="Limpar filtros" onClick={resetFilters}>
      <Icon name="filter" />
    </AppBarButton>
  ), [resetFilters]);
  useAppBarActions(barActions);

  const toggleExpand = useCallback((id: string) => {
    setExpandedProductId(prev => (prev === id ? null : id));
  }, []);

  const handleDelete = useCallback((product: Product) => {
    if (window.confirm(`Tem certeza que deseja remover "${product.name}" do estoque?`)) {
      deleteProduct(product.id);
      setExpandedProductId(null);
      if (editingProduct?.id === product.id) closeForm();
    }
  }, [deleteProduct, editingProduct, closeForm]);

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
    if (editingProduct) updateProduct(editingProduct.id, productData);
    else addProduct(productData);
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

  const lowCount = useMemo(() => filtered.filter(isLow).length, [filtered]);

  return (
    <div className="flex flex-col gap-2 min-w-0">

      {/* Busca */}
      <label className="h-14 rounded-full bg-surface-high px-4 flex items-center gap-4 text-on-surface-variant">
        <Icon name="search" />
        <input
          placeholder="Buscar produto"
          aria-label="Buscar produto"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-0 bg-transparent outline-none text-on-surface tracking-[0.5px] placeholder:text-on-surface-variant"
        />
      </label>

      {/* Categorias */}
      <div className="h-12 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-mask">
        <FilterChip label="Todos" active={filterCategory === 'Todos'} onSelect={setFilterCategory} />
        {CATEGORIES.map(cat => (
          <FilterChip key={cat.value} label={cat.label} active={filterCategory === cat.value} onSelect={setFilterCategory} />
        ))}
      </div>

      <div className="px-1 flex justify-between text-xs leading-4 tracking-[0.4px] text-on-surface-variant">
        <span>{filtered.length} {filtered.length === 1 ? 'produto' : 'produtos'}</span>
        {lowCount > 0 && <span className="font-medium text-warn">{lowCount} com estoque baixo</span>}
      </div>

      {/* Cadastro / edição */}
      {showForm && (
        <form onSubmit={handleSubmit} className="relative bg-surface-container rounded-[28px] p-5 flex flex-col gap-4 animate-fade-in">
          <button
            type="button"
            onClick={closeForm}
            aria-label="Fechar formulário"
            className="absolute right-2 top-2 w-12 h-12 rounded-full flex items-center justify-center text-on-surface-variant active:bg-surface-high"
          >
            <Icon name="close" />
          </button>
          <h2 className="text-base leading-6 font-medium pr-10">{editingProduct ? 'Editar produto' : 'Novo produto'}</h2>

          <Input
            label="Nome do produto"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Perfume Malbec 100ml"
            autoFocus={!editingProduct}
          />
          <Select label="Categoria" value={form.category} onChange={val => setForm({ ...form, category: val })} options={SELECT_OPTIONS} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preço (R$)"
              type="text"
              inputMode="numeric"
              value={form.price}
              onChange={e => setForm({ ...form, price: maskCurrency(e.target.value) })}
              placeholder="0,00"
            />
            <Input label="Qtd em estoque" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
          </div>
          <Input label="Mínimo para alerta de estoque baixo" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="2" />

          <div className="flex gap-3">
            {editingProduct && (
              <button
                type="button"
                aria-label="Remover produto"
                onClick={() => handleDelete(editingProduct)}
                className="w-12 h-12 shrink-0 rounded-full border border-outline text-error flex items-center justify-center active:bg-surface-high"
              >
                <Icon name="delete" />
              </button>
            )}
            <button type="submit" className="flex-1 h-12 rounded-full bg-primary text-on-primary text-sm font-medium tracking-[0.1px] active:opacity-90">
              {editingProduct ? 'Salvar alterações' : 'Adicionar produto'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-2 pb-20">
        {filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <span className="w-16 h-16 rounded-full bg-surface-high text-on-surface-variant flex items-center justify-center">
              <Icon name="box" size={32} />
            </span>
            <p className="text-base font-medium">{searchTerm ? `Nenhum resultado para "${searchTerm}"` : 'Nenhum produto encontrado'}</p>
            <p className="text-sm text-on-surface-variant">
              {!searchTerm && filterCategory === 'Todos' ? 'Toque em "Novo produto" para cadastrar o primeiro' : 'Tente outro filtro ou busca'}
            </p>
          </div>
        ) : (
          filtered.map(product => {
            const expanded = expandedProductId === product.id;
            const low = isLow(product);
            return (
              <div key={product.id} className="bg-surface-low rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(product.id)}
                  aria-expanded={expanded}
                  className="w-full h-[88px] px-4 flex items-center gap-3 text-left active:bg-surface-high transition-colors"
                >
                  <span
                    className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                      expanded ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    <Icon name={categoryIcon(product.category)} />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="flex flex-col">
                      <span className="text-base leading-6 font-medium truncate">{product.name}</span>
                      <span className="text-xs leading-4 text-on-surface-variant truncate">{product.category}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="flex-1 h-1 rounded-full bg-surface-highest overflow-hidden">
                        <span
                          className={`block h-1 rounded-full ${low ? 'bg-warn' : 'bg-primary'}`}
                          style={{ width: `${stockPercent(product)}%` }}
                        />
                      </span>
                      <span className="shrink-0 text-xs leading-4 font-medium text-on-surface-variant tabular-nums">{product.stock} un.</span>
                    </span>
                  </span>
                  <span className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-sm leading-5 font-medium tabular-nums">{formatCurrency(product.price)}</span>
                    {low && (
                      <span className="h-5 px-2 rounded-lg bg-warn-container text-on-warn-container text-[11px] leading-5 font-medium tracking-[0.5px]">
                        Baixo
                      </span>
                    )}
                  </span>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-3 flex gap-2 border-t border-outline-variant animate-fade-in">
                    <button
                      onClick={() => { setEditingProduct(product); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="flex-1 h-12 rounded-full bg-secondary-container text-on-secondary-container text-sm font-medium tracking-[0.1px] flex items-center justify-center gap-2 active:opacity-90"
                    >
                      <Icon name="edit" size={18} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      aria-label={`Remover ${product.name}`}
                      className="w-12 h-12 rounded-full border border-outline text-error flex items-center justify-center active:bg-surface-high"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Botão flutuante */}
      {!showForm && (
        <button
          onClick={openForm}
          className="fixed z-30 right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] lg:right-8 lg:bottom-8 h-14 pl-4 pr-5 rounded-2xl bg-primary-container text-on-primary-container flex items-center gap-3 text-sm font-medium tracking-[0.1px] shadow-[0_4px_10px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.24)] active:opacity-90"
        >
          <Icon name="add" />
          Novo produto
        </button>
      )}
    </div>
  );
};

export default memo(Inventory);
