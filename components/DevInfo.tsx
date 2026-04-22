import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  X,
  GitCommit,
  Tag,
  Clock,
  RefreshCw,
  CheckCircle2,
  Download,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface VersionPayload {
  version: string;
  commit: string;
  commitShort: string;
  message: string;
  date: string;
  buildTime: string;
}

interface DevInfoProps {
  open: boolean;
  onClose: () => void;
}

const LOCAL: VersionPayload = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  commitShort: __APP_COMMIT_SHORT__,
  message: __APP_COMMIT_MESSAGE__,
  date: __APP_COMMIT_DATE__,
  buildTime: __APP_BUILD_TIME__
};

const formatDateTime = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

const DevInfo: React.FC<DevInfoProps> = ({ open, onClose }) => {
  const [checking, setChecking] = useState(false);
  const [remote, setRemote] = useState<VersionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as VersionPayload;
      setRemote(data);
      setCheckedAt(Date.now());
    } catch (e: any) {
      setError('Não foi possível verificar. Sem conexão?');
    } finally {
      setChecking(false);
    }
  }, []);

  // Auto-check ao abrir
  useEffect(() => {
    if (open) {
      checkForUpdates();
    } else {
      setError(null);
      setRemote(null);
      setCheckedAt(null);
    }
  }, [open, checkForUpdates]);

  // Trava scroll do body enquanto aberto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const hasUpdate = !!(remote && remote.commit && remote.commit !== LOCAL.commit);

  const applyUpdate = useCallback(async () => {
    setUpdating(true);
    setError(null);
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          try { await reg.update(); } catch { /* noop */ }
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }
      // Pequeno delay para o SW concluir skipWaiting antes do reload.
      // O reload preserva o display-mode do PWA — o usuário continua dentro do app.
      setTimeout(() => window.location.reload(), 250);
    } catch (e) {
      setUpdating(false);
      setError('Falha ao aplicar a atualização.');
    }
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-lg">
              <GitCommit size={16} />
            </div>
            <div className="flex flex-col leading-none">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Informações do Sistema</h3>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">DevInfo</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl active:scale-90 transition-all"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <section className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Versão instalada</h4>

            <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
              <InfoRow icon={<Tag size={14} />} label="Versão" value={LOCAL.version} />
              <div className="flex items-start gap-3 py-1.5">
                <div className="text-slate-300 dark:text-slate-600 mt-0.5 shrink-0">
                  <GitCommit size={14} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Último commit</span>
                  <code className="font-mono text-[11px] px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded self-start">
                    {LOCAL.commitShort || '—'}
                  </code>
                  {LOCAL.message && (
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug break-words whitespace-pre-wrap">
                      {LOCAL.message}
                    </p>
                  )}
                </div>
              </div>
              <InfoRow icon={<Clock size={14} />} label="Data do commit" value={formatDateTime(LOCAL.date)} />
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Atualizações</h4>
              {checkedAt && (
                <span className="text-[9px] text-slate-400 dark:text-slate-600 font-bold">
                  Verificado {new Date(checkedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl px-4 py-3 text-xs font-semibold">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!error && remote && !hasUpdate && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-2xl px-4 py-3 text-xs font-semibold">
                <CheckCircle2 size={16} />
                <span>Você está na versão mais recente.</span>
              </div>
            )}

            {!error && hasUpdate && remote && (
              <div className="flex flex-col gap-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl p-4">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-rose-500 text-white rounded-lg shrink-0">
                    <Download size={14} />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-300">Nova versão disponível</span>
                    <span className="text-[10px] text-rose-500/80 dark:text-rose-300/70 font-bold uppercase tracking-wider">
                      v{remote.version} · {remote.commitShort}
                    </span>
                    {remote.message && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-snug break-words whitespace-pre-wrap">
                        {remote.message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={applyUpdate}
                  disabled={updating}
                  className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-rose-200 dark:shadow-none active:scale-95 transition-all"
                >
                  {updating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Atualizando...
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Atualizar agora
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={checkForUpdates}
              disabled={checking || updating}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest py-3 rounded-xl active:scale-95 transition-all disabled:opacity-60"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Verificando...' : 'Verificar novamente'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-1.5">
    <div className="text-slate-300 dark:text-slate-600 mt-0.5 shrink-0">{icon}</div>
    <div className="flex-1 min-w-0 flex flex-col">
      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{value}</span>
    </div>
  </div>
);

export default memo(DevInfo);
