import React, { createContext, memo, useContext, useEffect } from 'react';
import { Icon } from './Icon';

// Ações do canto direito da barra superior. Quem é dono do estado (a tela) as registra;
// o Layout as desenha. `node` precisa ser estável (useMemo), senão registra a cada render.
export const AppBarActionsContext = createContext<(node: React.ReactNode) => void>(() => {});

export const useAppBarActions = (node: React.ReactNode) => {
  const setActions = useContext(AppBarActionsContext);
  useEffect(() => {
    setActions(node);
    return () => setActions(null);
  }, [node, setActions]);
};

interface AppBarButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

// Botão de ícone da barra superior: 48 × 48, como o alvo de toque do Material.
export const AppBarButton: React.FC<AppBarButtonProps> = memo(({ label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="relative w-12 h-12 rounded-full flex items-center justify-center text-on-surface-variant active:bg-surface-high transition-colors"
  >
    {children}
  </button>
));

export const greetingFor = (hour: number): string => {
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

interface HomeAppBarProps {
  userName: string;
  hasReminders: boolean;
  onProfile: () => void;
  onSearch: () => void;
  onNotifications: () => void;
}

// Barra superior da tela inicial: avatar, saudação, busca e avisos.
export const HomeAppBar: React.FC<HomeAppBarProps> = memo(({ userName, hasReminders, onProfile, onSearch, onNotifications }) => {
  const trimmed = userName.trim();
  const firstName = trimmed ? trimmed.split(' ')[0] : 'Consultora';
  const initial = (trimmed[0] ?? 'K').toUpperCase();

  return (
    <>
      <button
        type="button"
        onClick={onProfile}
        aria-label="Abrir perfil"
        className="relative shrink-0 w-10 h-10 mr-3 rounded-full bg-primary-container text-on-primary-container text-base font-medium flex items-center justify-center before:content-[''] before:absolute before:-inset-1"
      >
        {initial}
      </button>
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-xs leading-4 text-on-surface-variant">{greetingFor(new Date().getHours())}</span>
        <h1 className="text-base leading-6 font-medium truncate">{firstName}</h1>
      </div>
      <div className="flex items-center -mr-3">
        <AppBarButton label="Buscar clientes" onClick={onSearch}>
          <Icon name="search" />
        </AppBarButton>
        <AppBarButton label={hasReminders ? 'Avisos: há parcelas vencendo hoje' : 'Avisos'} onClick={onNotifications}>
          <Icon name="bell" />
          {hasReminders && <span className="absolute top-[9px] right-[11px] w-[9px] h-[9px] rounded-full bg-error border-2 border-surface" />}
        </AppBarButton>
      </div>
    </>
  );
});
