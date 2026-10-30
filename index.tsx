import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startup } from './services/startup';
import { IS_ANDROID_BUILD } from './services/native/platform';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Cargas críticas (banco, fonte, telas) em paralelo, antes mesmo do primeiro render.
startup();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Só em produção, e já agora (não no `load`): o pré-cache do service worker baixa em paralelo com a abertura.
// Em dev o SW serviria módulos velhos por cima do HMR. No APK não há SW: o app já está em disco.
if (import.meta.env.PROD && !IS_ANDROID_BUILD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => console.error('Ke Gestão: falha no Service Worker', err));
}
