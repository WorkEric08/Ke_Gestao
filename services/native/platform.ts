import { Capacitor } from '@capacitor/core';

// Dentro do APK (Capacitor). Decisão de execução: fora do nativo os plugins não fazem nada.
export const isNative = (): boolean => Capacitor.isNativePlatform();

// Decisão de build (`npm run build:android`): o pacote do APK não leva service worker nem a checagem
// de atualização por `version.json`, porque o app já está em disco e quem atualiza é a loja/o APK.
export const IS_ANDROID_BUILD = import.meta.env.VITE_ANDROID === '1';
