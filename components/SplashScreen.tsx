
import React from 'react';
import { Sparkles, TrendingUp, Package, Droplet } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 overflow-hidden">
      {/* Ambiente de Boutique Premium */}
      <div className="absolute w-[600px] h-[600px] bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-[140px] animate-pulse"></div>
      
      <div className="relative flex flex-col items-center">
        {/* O Frasco de Perfume de Luxo */}
        <div className="relative mb-14">
          <div className="relative z-10 w-24 h-32 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_25px_70px_rgba(244,63,94,0.18)] border-2 border-rose-50 dark:border-rose-900/30 flex items-center justify-center animate-[perfumeFloat_2.5s_ease-in-out_infinite]">
            
            {/* Válvula de Ouro e Tampa */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-8 h-8 flex flex-col items-center">
              <div className="w-3 h-2 bg-amber-200 dark:bg-amber-900/50 rounded-t-sm"></div>
              <div className="w-12 h-6 bg-rose-500 rounded-lg shadow-lg"></div>
            </div>

            {/* Essência Rosada com Movimento */}
            <div className="absolute bottom-2 left-2 right-2 top-8 bg-gradient-to-t from-rose-200/40 to-transparent dark:from-rose-900/20 rounded-2xl overflow-hidden">
               <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-rose-500/10 animate-[liquidWave_3s_ease-in-out_infinite]"></div>
            </div>

            <Droplet className="text-rose-500 w-12 h-12 relative z-20" strokeWidth={1} />
            
            {/* Brilhos Dinâmicos */}
            <Sparkles 
              className="absolute -top-10 -right-8 text-amber-400 animate-[sparkleGrow_2s_infinite]" 
              size={32} 
              fill="currentColor"
            />
          </div>

          {/* Efeito de Borrifada (Sales & Inventory) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
            <TrendingUp 
              className="absolute text-emerald-500 opacity-0 animate-[sprayLeft_1.8s_ease-out_0.6s_forwards]" 
              size={36} 
            />
            <Package 
              className="absolute text-rose-400 opacity-0 animate-[sprayRight_1.8s_ease-out_0.9s_forwards]" 
              size={36} 
            />
          </div>
        </div>

        {/* Textos de Identidade */}
        <div className="flex flex-col items-center text-center gap-1">
          <h1 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.8em] mb-4 opacity-0 animate-[fadeIn_1s_ease-out_0.5s_forwards]">
            Ke Gestão
          </h1>
          
          <div className="relative">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter opacity-0 animate-[fadeInUp_0.8s_ease-out_1s_forwards]">
              Gestão e vendas
            </h2>
            <div className="mt-3 h-1 bg-rose-500 rounded-full mx-auto opacity-0 animate-[scaleWidth_0.8s_ease-out_1.4s_forwards]"></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes perfumeFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes liquidWave {
          0%, 100% { height: 60%; }
          50% { height: 75%; }
        }
        @keyframes sparkleGrow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleWidth {
          from { width: 0; opacity: 0; }
          to { width: 60px; opacity: 1; }
        }
        @keyframes sprayLeft {
          0% { transform: translate(0, -20px) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(-100px, -80px) scale(1.4); opacity: 0; }
        }
        @keyframes sprayRight {
          0% { transform: translate(0, -20px) scale(0); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translate(100px, -80px) scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
