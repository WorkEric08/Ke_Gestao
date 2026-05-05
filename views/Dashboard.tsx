
import React, { memo, useMemo } from 'react';
import { Card, Button, Badge } from '../components/UI';
import {
  ShoppingCart,
  UserPlus,
  PackagePlus,
  BellRing,
  CheckCircle2,
  TrendingUp,
  Calendar,
  ChevronRight,
  Plus,
  Users,
  Package,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { View } from '../types';

interface Reminder {
  customerName: string;
  amount: number;
  id: string;
}

interface DashboardProps {
  stats: any;
  setView: (view: View) => void;
  userName: string;
  reminders: Reminder[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, setView, userName, reminders }) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return 'Boa madrugada';
    if (hour >= 6 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const displayName = useMemo(
    () => (userName.trim() ? userName.split(' ')[0] : 'Consultora'),
    [userName]
  );

  const lastMonthLabel = useMemo(() => (
    stats.furthestInstallment
      ? new Date(stats.furthestInstallment).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
      : null
  ), [stats.furthestInstallment]);

  return (
    <div className="animate-fade-in pb-8">
      {/* Desktop: two-column grid. Mobile: single column flex */}
      <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-7">

          {/* Greeting */}
          <section className="px-1 pt-2">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              {greeting}
            </p>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Olá, {displayName}
            </h2>
          </section>

          {/* KPI Cards — 4 cols on desktop, 3 on mobile */}
          <section className="px-1">
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-3">
              <Card
                className="flex flex-col items-center justify-center py-5 px-1 bg-white dark:bg-[#111827] border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform cursor-pointer overflow-hidden group"
                onClick={() => setView('inventory')}
              >
                <div className="p-2.5 bg-rose-500 text-white rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-none">
                  <ShoppingCart size={16} strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter text-center">Vendas</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white mt-1 truncate w-full text-center tracking-tight">
                  {formatCurrency(stats.salesMonth).replace('R$', '').trim()}
                </span>
              </Card>

              <Card
                className="flex flex-col items-center justify-center py-5 px-1 bg-white dark:bg-[#111827] border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform cursor-pointer group"
                onClick={() => setView('customers')}
              >
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                  <Users size={16} strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter text-center">Clientes</span>
                <span className="text-lg font-black text-slate-900 dark:text-white mt-1 leading-none tracking-tight">{stats.activeCustomers}</span>
              </Card>

              <Card
                className={`flex flex-col items-center justify-center py-5 px-1 transition-all bg-white dark:bg-[#111827] shadow-sm cursor-pointer active:scale-95 group ${
                  stats.lowStockItems > 0
                    ? 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/10'
                    : 'border-slate-100 dark:border-slate-800'
                }`}
                onClick={() => setView('inventory')}
              >
                <div className={`p-2.5 rounded-xl mb-3 group-hover:scale-110 transition-transform shadow-none ${stats.lowStockItems > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Package size={16} strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter text-center">Estoque</span>
                <span className={`text-lg font-black leading-none mt-1 tracking-tight ${stats.lowStockItems > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                  {stats.lowStockItems}
                </span>
              </Card>
            </div>
          </section>

          {/* Receivables flow */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Fluxo de Recebíveis</h3>
              {lastMonthLabel && (
                <Badge color="rose">Até {lastMonthLabel}</Badge>
              )}
            </div>

            <Card className="bg-white dark:bg-[#111827] border-slate-100 dark:border-slate-800 p-0 overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none">
              <div className="p-6 flex flex-col gap-7">
                <div className="grid grid-cols-2 gap-8 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800/50 -translate-x-1/2"></div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div> Este Mês
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(stats.receivableThisMonth)}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 text-right">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest flex items-center gap-1.5 justify-end">
                      Futuro <TrendingUp size={10} className="text-emerald-500" />
                    </span>
                    <span className="text-xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">{formatCurrency(stats.receivableFuture)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={12} className="text-slate-300 dark:text-slate-700" />
                    <span className="text-[9px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-[0.15em]">Cronograma de Entrada</span>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-mask px-1">
                    {stats.receivablesByMonth.length === 0 ? (
                      <div className="w-full py-4 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Sem previsões</span>
                      </div>
                    ) : (
                      <div className="flex gap-3 pb-2">
                        {stats.receivablesByMonth.map((m: any) => (
                          <div
                            key={m.key}
                            className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border-2 transition-all shrink-0 min-w-[95px] ${
                              m.isCurrent
                                ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none translate-y-[-2px]'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-500'
                            }`}
                          >
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${m.isCurrent ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'}`}>
                              {m.label}
                            </span>
                            <span className={`text-sm font-black tracking-tight ${m.isCurrent ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {formatCurrency(m.total).replace('R$', '').trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setView('debtors')}
                className="w-full py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center justify-center gap-2 group"
              >
                Ver Detalhamento Financeiro <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Card>
          </section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-7">

          {/* Quick Actions */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] px-1">Ações Rápidas</h3>
            <div className="flex flex-col gap-3">
              <Button
                fullWidth
                onClick={() => setView('new-sale')}
                className="h-14 rounded-2xl text-base font-black tracking-tight flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 active:scale-95 transition-all bg-gradient-to-br from-rose-500 to-rose-600 border-none"
              >
                <Plus size={20} strokeWidth={3} className="drop-shadow-sm" /> Iniciar Nova Venda
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setView('add-customer')}
                  className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-none bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 shadow-sm active:bg-slate-50 dark:active:bg-slate-800 transition-all"
                >
                  <UserPlus size={16} className="text-rose-500" /> Clientes
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setView('add-product')}
                  className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-none bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 shadow-sm active:bg-slate-50 dark:active:bg-slate-800 transition-all"
                >
                  <PackagePlus size={16} className="text-rose-500" /> Produtos
                </Button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Notificações</h3>
            </div>

            {reminders.length > 0 ? (
              <div className="flex flex-col gap-3">
                {reminders.map(reminder => (
                  <Card
                    key={reminder.id}
                    className="flex items-center gap-4 py-4 pr-5 border-l-4 border-l-rose-500 active:scale-[0.98] transition-transform cursor-pointer shadow-lg shadow-rose-100/30 dark:shadow-none bg-white dark:bg-[#111827] group"
                    onClick={() => setView('debtors')}
                  >
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <BellRing size={20} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">{reminder.customerName}</h4>
                        <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded uppercase tracking-tighter">Hoje</span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
                        Vencimento de {formatCurrency(reminder.amount)} pendente
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 dark:text-slate-700" />
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="flex items-center gap-5 py-5 border-dashed border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 text-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                    <CheckCircle2 size={20} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h4 className="font-black text-[13px] text-slate-800 dark:text-slate-200 leading-none">Tudo em dia!</h4>
                    <p className="text-[8px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.2em]">Nenhuma pendência para hoje</p>
                  </div>
                </div>
              </Card>
            )}
          </section>
        </div>

      </div>
    </div>
  );
};

export default memo(Dashboard);
