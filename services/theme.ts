export type Theme = 'light' | 'dark';

// Espelho do tema para a primeira pintura (o index.html o lê antes do React e do banco).
export const MANUAL_KEY = 'theme_manually_set';
export const THEME_KEY = 'kegestao_theme';

const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark';

// Mesma regra do script inline do index.html: o tema salvo só vale se a pessoa o escolheu
// à mão; senão, segue o sistema.
export const resolveTheme = (storage: Pick<Storage, 'getItem'>, systemDark: boolean): Theme => {
  if (storage.getItem(MANUAL_KEY) === 'true') {
    const saved = storage.getItem(THEME_KEY);
    if (isTheme(saved)) return saved;
  }
  return systemDark ? 'dark' : 'light';
};

export const saveManualTheme = (storage: Pick<Storage, 'setItem'>, theme: Theme): void => {
  storage.setItem(MANUAL_KEY, 'true');
  storage.setItem(THEME_KEY, theme);
};

export const isThemeValue = isTheme;
