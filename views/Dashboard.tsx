import React, { memo } from 'react';
import { Icon } from '../components/Icon';
import { formatCurrency, formatCurrencyWhole, initialsOf } from '../utils/format';
import { View } from '../types';
import { Reminder } from '../core/stats';

interface MonthTotal {
  key: string;
  label: string;
  total: number;
  isCurrent: boolean;
}

interface DashboardStats {
  salesMonth: number;
  totalReceivable: number;
  receivableThisMonth: number;
  receivableFuture: number;
  receivablesByMonth: MonthTotal[];
  furthestInstallment: number | null;
  activeCustomers: number;
  lowStockItems: number;
}

interface DashboardProps {
  stats: DashboardStats;
  setView: (view: View) => void;
  reminders: Reminder[];
}

const SECTION_TITLE = 'text-base leading-6 font-medium';

const Dashboard: React.FC<DashboardProps> = ({ stats, setView, reminders }) => {
  const months = stats.receivablesByMonth;
  const lastMonth = months.length > 0 ? months[months.length - 1].label.toLowerCase() : null;
  const lowStock = stats.lowStockItems;

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-6 lg:items-start">
      <div className="flex flex-col gap-4 min-w-0">

        {/* ── A receber ── */}
        <section className="bg-surface-container rounded-[28px] p-5 flex flex-col gap-1" aria-label="A receber">
          <div className="h-8 flex items-center justify-between">
            <span className="text-sm leading-5 font-medium text-on-surface-variant">A receber</span>
            {lastMonth && (
              <span className="h-8 px-3 border border-outline rounded-lg inline-flex items-center text-xs font-medium tracking-[0.5px] text-on-surface-variant">
                Até {lastMonth}
              </span>
            )}
          </div>
          <span className="text-[36px] leading-[44px] tabular-nums">{formatCurrency(stats.totalReceivable)}</span>
          <div className="mt-2 flex justify-between text-sm leading-5">
            <span className="text-on-surface-variant">Este mês</span>
            <span className="font-medium tabular-nums">{formatCurrency(stats.receivableThisMonth)}</span>
          </div>
          <div className="flex justify-between text-sm leading-5">
            <span className="text-on-surface-variant">Futuro</span>
            <span className="font-medium text-success tabular-nums">{formatCurrency(stats.receivableFuture)}</span>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setView('debtors')}
              className="flex-1 h-12 rounded-full border border-outline text-primary text-sm font-medium tracking-[0.1px] flex items-center justify-center gap-2 active:bg-surface-high transition-colors"
            >
              Parcelas
              <Icon name="arrowOut" size={18} />
            </button>
            <button
              onClick={() => setView('new-sale')}
              className="flex-1 h-12 rounded-full bg-primary text-on-primary text-sm font-medium tracking-[0.1px] flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
            >
              <Icon name="add" size={18} />
              Nova venda
            </button>
          </div>
        </section>

        {/* ── Indicadores ── */}
        <section className="flex gap-2" aria-label="Indicadores">
          <div className="flex-1 min-w-0 bg-surface-low rounded-2xl p-3 flex flex-col gap-2">
            <span className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <Icon name="trend" size={20} />
            </span>
            <div className="flex flex-col">
              <span className="text-xs leading-4 text-on-surface-variant">Vendas do mês</span>
              <span className="text-base leading-6 font-medium truncate tabular-nums">{formatCurrencyWhole(stats.salesMonth)}</span>
            </div>
          </div>

          <button
            onClick={() => setView('customers')}
            className="flex-1 min-w-0 bg-surface-low rounded-2xl p-3 flex flex-col gap-2 items-start text-left active:bg-surface-high transition-colors"
          >
            <span className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
              <Icon name="people" size={20} />
            </span>
            <span className="flex flex-col">
              <span className="text-xs leading-4 text-on-surface-variant">Clientes ativos</span>
              <span className="text-base leading-6 font-medium">{stats.activeCustomers}</span>
            </span>
          </button>

          <button
            onClick={() => setView('inventory')}
            className={`flex-1 min-w-0 rounded-2xl p-3 flex flex-col gap-2 items-start text-left active:opacity-90 transition-opacity ${
              lowStock > 0 ? 'bg-warn-container text-on-warn-container' : 'bg-surface-low'
            }`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                lowStock > 0 ? 'bg-warn text-warn-container' : 'bg-secondary-container text-on-secondary-container'
              }`}
            >
              <Icon name="warning" size={20} />
            </span>
            <span className="flex flex-col">
              <span className={`text-xs leading-4 ${lowStock > 0 ? '' : 'text-on-surface-variant'}`}>Estoque baixo</span>
              <span className="text-base leading-6 font-medium">
                {lowStock} {lowStock === 1 ? 'item' : 'itens'}
              </span>
            </span>
          </button>
        </section>

        {/* ── Cronograma de entrada ── */}
        <section className="flex flex-col gap-2 mt-1" aria-label="Cronograma de entrada">
          <div className="h-6 flex items-center justify-between">
            <h2 className={SECTION_TITLE}>Cronograma de entrada</h2>
            <button onClick={() => setView('debtors')} className="h-12 -my-3 px-2 -mr-2 text-sm font-medium text-primary">
              Ver tudo
            </button>
          </div>
          {months.length === 0 ? (
            <div className="h-16 rounded-2xl border border-dashed border-outline-variant flex items-center justify-center text-sm text-on-surface-variant">
              Sem parcelas a receber
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-mask">
              {months.map((m) => (
                <div
                  key={m.key}
                  className={`shrink-0 w-[92px] rounded-2xl px-3 py-2.5 flex flex-col gap-0.5 ${
                    m.isCurrent ? 'bg-primary-container text-on-primary-container' : 'bg-surface-low text-on-surface'
                  }`}
                >
                  <span className={`text-xs leading-4 font-medium tracking-[0.5px] ${m.isCurrent ? '' : 'text-on-surface-variant'}`}>
                    {m.label}
                  </span>
                  <span className="text-base leading-6 font-medium tabular-nums">{formatCurrency(m.total).replace(/R\$\s?/, '')}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Vence hoje ── */}
      <section className="flex flex-col gap-2 mt-1 lg:mt-0" aria-label="Vence hoje">
        <div className="h-6 flex items-center justify-between">
          <h2 className={SECTION_TITLE}>Vence hoje</h2>
          {reminders.length > 0 && (
            <span className="h-5 min-w-5 px-1.5 rounded-full bg-error-container text-on-error-container text-[11px] leading-5 font-medium text-center">
              {reminders.length}
            </span>
          )}
        </div>
        {reminders.length === 0 ? (
          <div className="bg-surface-low rounded-2xl p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-success-container text-on-success-container flex items-center justify-center shrink-0">
              <Icon name="check" />
            </span>
            <div className="flex flex-col">
              <span className="text-base leading-6 font-medium">Tudo em dia</span>
              <span className="text-sm leading-5 text-on-surface-variant">Nenhuma parcela vence hoje</span>
            </div>
          </div>
        ) : (
          reminders.map((r) => (
            <button
              key={r.id}
              onClick={() => setView('debtors')}
              className="h-[72px] bg-surface-low rounded-2xl px-4 flex items-center gap-3 text-left active:bg-surface-high transition-colors"
            >
              <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-base font-medium shrink-0">
                {initialsOf(r.customerName)}
              </span>
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="text-base leading-6 font-medium truncate">{r.customerName}</span>
                <span className="text-sm leading-5 text-on-surface-variant truncate">
                  Parcela {r.installmentNumber} de {r.installmentCount} · vence hoje
                </span>
              </span>
              <span className="text-sm leading-5 font-medium tabular-nums">{formatCurrency(r.amount)}</span>
            </button>
          ))
        )}
      </section>
    </div>
  );
};

export default memo(Dashboard);
