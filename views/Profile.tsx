
import React, { useState } from 'react';
import { Card, Input, Button } from '../components/UI';
import { UserCircle, Save, CheckCircle2, Download } from 'lucide-react';
import { UserProfile, View } from '../types';

interface ProfileProps {
  profile: UserProfile;
  updateProfile: (p: UserProfile) => void;
  canInstall?: boolean;
  onInstall?: () => void;
  setView: (view: View) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, updateProfile, canInstall, onInstall, setView }) => {
  const [formData, setFormData] = useState({
    name: profile.name,
    businessName: profile.businessName
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    updateProfile({
      ...profile,
      name: formData.name,
      businessName: formData.businessName
    });
    setIsSaved(true);
    
    // Auto redirect to dashboard after a short delay for feedback
    setTimeout(() => {
      setView('dashboard');
    }, 1200);
  };

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

      {canInstall && (
        <section className="flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-400 dark:text-slate-600 uppercase tracking-widest px-1">Aplicativo</h3>
          <Card className="flex flex-col gap-4 border-2 border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <Download size={20} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Instalar no Celular</p>
                <p className="text-[10px] text-slate-500">Acesse offline e tenha ícone na tela inicial</p>
              </div>
            </div>
            <Button variant="primary" fullWidth onClick={onInstall} className="bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200">
              Instalar Ke Gestão
            </Button>
          </Card>
        </section>
      )}

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

export default Profile;
