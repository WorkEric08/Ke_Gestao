
import React, { useState, memo, useCallback } from 'react';
import { Card, Input, Button } from '../components/UI';
import { UserCircle, Save, CheckCircle2, Download, Smartphone } from 'lucide-react';
import { UserProfile, View } from '../types';

interface ProfileProps {
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
  canInstall?: boolean;
  onInstall?: () => void;
  isInstalled?: boolean;
  isIOS?: boolean;
  setView: (view: View) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, updateProfile, canInstall, onInstall, isInstalled, isIOS, setView }) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    businessName: profile.businessName
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = useCallback(() => {
    updateProfile({
      ...profile,
      name: formData.name,
      businessName: formData.businessName
    });
    setIsSaved(true);
    setTimeout(() => {
      setView('dashboard');
    }, 1200);
  }, [profile, formData, updateProfile, setView]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-3xl flex items-center justify-center">
          <UserCircle size={64} />
        </div>
        <h2 className="text-xl font-bold dark:text-slate-100">
          {profile.name || 'Sua Conta'}
        </h2>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest px-1">Aplicativo</h3>

        {isInstalled ? (
          <Card className="flex items-center gap-3 border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">App Instalado</p>
              <p className="text-[10px] text-slate-500">Ke Gestão está na sua tela inicial</p>
            </div>
          </Card>
        ) : canInstall ? (
          <Card className="flex flex-col gap-4 border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <Download size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Instalar no Dispositivo</p>
                <p className="text-[10px] text-slate-500">Acesse offline e tenha ícone na tela inicial</p>
              </div>
            </div>
            <Button variant="primary" fullWidth onClick={onInstall} className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200">
              Instalar Ke Gestão
            </Button>
          </Card>
        ) : isIOS ? (
          <Card className="flex flex-col gap-4 border-2 border-sky-100 dark:border-sky-900/30 bg-sky-50/30 dark:bg-sky-900/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-500 text-white rounded-xl">
                <Smartphone size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Instalar no iPhone / iPad</p>
                <p className="text-[10px] text-slate-500">Adicione à tela inicial pelo Safari</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 font-bold text-[10px] shrink-0">1</span>
                <span>Toque no ícone de compartilhar na barra do Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 font-bold text-[10px] shrink-0">2</span>
                <span>Selecione <strong>"Adicionar à Tela de Início"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 font-bold text-[10px] shrink-0">3</span>
                <span>Confirme tocando em <strong>"Adicionar"</strong></span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col gap-4 border-2 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-400 text-white rounded-xl">
                <Smartphone size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Instalar como App</p>
                <p className="text-[10px] text-slate-500">Use o menu do seu navegador para instalar</p>
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
              <p><strong>Chrome/Edge:</strong> menu ⋮ → "Instalar aplicativo"</p>
              <p><strong>Samsung Internet:</strong> menu → "Adicionar à tela inicial"</p>
            </div>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest px-1">Configurações do Perfil</h3>
        <Card className="flex flex-col gap-4">
          <Input 
            label="Seu Nome" 
            placeholder="Ex: Coloque seu primeiro nome"
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <Input 
            label="Nome do Negócio" 
            placeholder="Ex: Gestão e vendas"
            value={formData.businessName} 
            onChange={e => setFormData({...formData, businessName: e.target.value})} 
          />
        </Card>
      </section>

      <div className="mt-4 flex flex-col gap-4">
        <Button 
          variant={isSaved ? "secondary" : "primary"} 
          fullWidth 
          onClick={handleSave}
          className={isSaved ? "text-emerald-500 dark:text-emerald-400" : ""}
          disabled={isSaved}
        >
          {isSaved ? (
            <>
              <CheckCircle2 size={20} /> Alterações Salvas
            </>
          ) : (
            <>
              <Save size={20} /> Salvar Alterações
            </>
          )}
        </Button>
        
        <p className="text-center text-[10px] text-gray-400 dark:text-slate-600">
          Ke Gestão v1.5.0 • Perfil do Sucesso
        </p>
      </div>
    </div>
  );
};

export default memo(Profile);
