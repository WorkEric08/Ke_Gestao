import { registerPlugin } from '@capacitor/core';
import { isNative } from './platform';

interface WindowColorsPlugin {
  setColors(options: { color: string; dark: boolean }): Promise<void>;
}

// Plugin local (native/android/WindowColorsPlugin.java). Fora do nativo a ponte não existe e a chamada vira nada.
const WindowColors = registerPlugin<WindowColorsPlugin>('WindowColors');

const SURFACE_DARK = '#000000';
const SURFACE_LIGHT = '#FFF8F8';

// Cor atrás da WebView, da barra de status e da barra de gestos acompanha o tema do app (e não só o do sistema),
// com o ícone das barras claro ou escuro conforme o fundo. No PWA essa camada é do navegador e não se troca.
export const applyWindowColors = (dark: boolean): void => {
  if (!isNative()) return;
  WindowColors.setColors({ color: dark ? SURFACE_DARK : SURFACE_LIGHT, dark }).catch(() => {
    /* sem a camada nativa o app segue com o fundo do tema de abertura (preto) */
  });
};
