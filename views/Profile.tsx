import React, { useState, useRef, memo, useCallback } from 'react';
import { Icon, IconName } from '../components/Icon';
import { UserProfile } from '../types';
import DevInfo from '../components/DevInfo';

interface ProfileProps {
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
  canInstall?: boolean;
  onInstall?: () => void;
  isInstalled?: boolean;
  isIOS?: boolean;
  isDark: boolean;
  toggleTheme: () => void;
}

const SUBHEADER = 'px-4 pt-2 text-sm leading-5 font-medium text-primary';
const GROUP = 'bg-surface-low rounded-[28px] py-1 flex flex-col';
const ROW = 'min-h-16 pl-5 pr-4 flex items-center gap-4 text-left';

// Interruptor do Material 3: 52 × 32; desligado tem contorno e bolinha de 16, ligado vira primário com bolinha de 24.
const SwitchTrack: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    aria-hidden="true"
    className={`relative shrink-0 w-[52px] h-8 rounded-full transition-colors ${
      on ? 'bg-primary' : 'bg-surface-highest border-2 border-outline'
    }`}
  >
    <span
      className={`absolute rounded-full transition-all ${
        on ? 'left-6 top-1 w-6 h-6 bg-on-primary' : 'left-1.5 top-1.5 w-4 h-4 bg-outline'
      }`}
    />
  </span>
);

interface FieldRowProps {
  icon: IconName;
  label: string;
  value: string;
  onSave: (value: string) => void;
}

// A linha mostra o valor; tocar nela vira um campo. Salva ao sair do campo ou no Enter; Esc cancela.
const FieldRow = memo<FieldRowProps>(({ icon, label, value, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const cancelled = useRef(false);

  const start = () => {
    cancelled.current = false;
    setDraft(value);
    setEditing(true);
  };

  const finish = () => {
    setEditing(false);
    const next = draft.trim();
    if (!cancelled.current && next !== value) onSave(next);
  };

  if (!editing) {
    return (
      <button type="button" onClick={start} className={`${ROW} w-full active:bg-surface-high transition-colors`}>
        <span className="text-on-surface-variant flex"><Icon name={icon} /></span>
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="text-xs leading-4 text-on-surface-variant">{label}</span>
          <span className="text-base leading-6 truncate">{value || 'Toque para preencher'}</span>
        </span>
        <span className="text-on-surface-variant flex"><Icon name="chevron" /></span>
      </button>
    );
  }

  return (
    <label className={`${ROW} w-full bg-surface-high`}>
      <span className="text-on-surface-variant flex"><Icon name={icon} /></span>
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="text-xs leading-4 text-primary">{label}</span>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              cancelled.current = true;
              e.currentTarget.blur();
            }
          }}
          autoComplete="off"
          enterKeyHint="done"
          className="bg-transparent outline-none text-base leading-6 text-on-surface w-full"
        />
      </span>
    </label>
  );
});

const Profile: React.FC<ProfileProps> = ({ profile, updateProfile, canInstall, onInstall, isInstalled, isIOS, isDark, toggleTheme }) => {
  const [installFeedback, setInstallFeedback] = useState<string | null>(null);
  const [devInfoOpen, setDevInfoOpen] = useState(false);

  const handleInstallClick = useCallback(() => {
    if (canInstall && onInstall) {
      onInstall();
      return;
    }
    setInstallFeedback('O navegador ainda não liberou a instalação automática. Aguarde alguns segundos e toque novamente, ou abra o menu ⋮ do navegador e escolha "Instalar aplicativo" / "Adicionar à tela inicial".');
    setTimeout(() => setInstallFeedback(null), 10000);
  }, [canInstall, onInstall]);

  const saveName = useCallback((name: string) => updateProfile({ ...profile, name }), [profile, updateProfile]);
  const saveBusiness = useCallback((businessName: string) => updateProfile({ ...profile, businessName }), [profile, updateProfile]);

  const initial = (profile.name.trim()[0] ?? 'K').toUpperCase();

  return (
    <div className="flex flex-col gap-3">

      {/* Identidade */}
      <div className="px-1 pb-1 flex items-center gap-4">
        <span className="w-14 h-14 rounded-full bg-primary-container text-on-primary-container text-2xl font-medium flex items-center justify-center">
          {initial}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-base leading-6 font-medium truncate">{profile.name || 'Sua conta'}</span>
          <span className="text-sm leading-5 text-on-surface-variant truncate">{profile.businessName}</span>
        </div>
      </div>

      {/* Instalar */}
      {isInstalled ? (
        <div className="bg-success-container text-on-success-container rounded-[28px] p-5 flex items-center gap-4">
          <span className="shrink-0 w-12 h-12 rounded-full bg-success text-success-container flex items-center justify-center">
            <Icon name="check" />
          </span>
          <div className="flex flex-col">
            <span className="text-base leading-6 font-medium">App instalado</span>
            <span className="text-sm leading-5 opacity-85">Ke Gestão está na sua tela inicial</span>
          </div>
        </div>
      ) : isIOS ? (
        <div className="bg-primary-container text-on-primary-container rounded-[28px] p-5 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-base leading-6 font-medium">Instalar no iPhone / iPad</span>
            <span className="text-sm leading-5 opacity-85">Adicione à tela inicial pelo Safari</span>
          </div>
          <ol className="flex flex-col gap-2 text-sm leading-5 list-decimal pl-5">
            <li>Toque no ícone de compartilhar na barra do Safari</li>
            <li>Selecione <strong>"Adicionar à Tela de Início"</strong></li>
            <li>Confirme tocando em <strong>"Adicionar"</strong></li>
          </ol>
        </div>
      ) : (
        <div className="bg-primary-container text-on-primary-container rounded-[28px] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="shrink-0 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center">
              <Icon name="download" />
            </span>
            <div className="flex flex-col">
              <span className="text-base leading-6 font-medium">Instalar no dispositivo</span>
              <span className="text-sm leading-5 opacity-85">Acesse offline e tenha o ícone na tela inicial</span>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="h-12 rounded-full bg-primary text-on-primary text-sm font-medium tracking-[0.1px] flex items-center justify-center gap-2 active:opacity-90"
          >
            <Icon name="download" size={18} />
            Instalar Ke Gestão
          </button>
          {installFeedback && (
            <p role="status" className="text-xs leading-4 rounded-xl bg-warn-container text-on-warn-container p-3">{installFeedback}</p>
          )}
        </div>
      )}

      {/* Preferências */}
      <h2 className={SUBHEADER}>Preferências</h2>
      <div className={GROUP}>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          className={`${ROW} w-full active:bg-surface-high transition-colors`}
        >
          <span className="text-on-surface-variant flex"><Icon name="moon" /></span>
          <span className="flex-1 flex flex-col">
            <span className="text-base leading-6">Modo escuro</span>
            <span className="text-xs leading-4 text-on-surface-variant">Segue o sistema até você escolher</span>
          </span>
          <SwitchTrack on={isDark} />
        </button>
        <button type="button" onClick={() => setDevInfoOpen(true)} className={`${ROW} w-full active:bg-surface-high transition-colors`}>
          <span className="text-on-surface-variant flex"><Icon name="info" /></span>
          <span className="flex-1 flex flex-col">
            <span className="text-base leading-6">Informações do sistema</span>
            <span className="text-xs leading-4 text-on-surface-variant">Versão e atualizações</span>
          </span>
          <span className="text-on-surface-variant flex"><Icon name="chevron" /></span>
        </button>
      </div>

      {/* Dados do perfil */}
      <h2 className={SUBHEADER}>Configurações do perfil</h2>
      <div className={GROUP}>
        <FieldRow icon="person" label="Seu nome" value={profile.name} onSave={saveName} />
        <FieldRow icon="store" label="Nome do negócio" value={profile.businessName} onSave={saveBusiness} />
      </div>

      <p className="pt-1 text-center text-xs leading-4 tracking-[0.4px] text-on-surface-variant">Ke Gestão v1.5.0</p>

      <DevInfo open={devInfoOpen} onClose={() => setDevInfoOpen(false)} />
    </div>
  );
};

export default memo(Profile);
