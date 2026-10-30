import { boot } from './boot';
import { prefetchRoutes } from '../views/routes';

// Meta de abertura: tudo crítico pronto antes da animação terminar (2 s), com folga.
const BUDGET_MS = 1800;

interface SplashApi {
  finished: Promise<void>;
  hide: () => void;
}

declare global {
  interface Window {
    __splash?: SplashApi;
  }
}

// O App chama quando a primeira tela pronta foi montada; esperamos duas pinturas para ela já estar visível.
let resolveRendered: () => void = () => {};
const rendered = new Promise<void>((resolve) => { resolveRendered = resolve; });

export const markRendered = () => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolveRendered()));
};

// A fonte é variável (um arquivo só): carregar um peso carrega todos. O texto pede o subconjunto latino.
const loadFonts = (): Promise<unknown> =>
  Promise.allSettled([
    document.fonts.load('400 16px Roboto', 'Ke Gestão R$ 0123456789 ãçé'),
    document.fonts.load('500 16px Roboto', 'Ke Gestão R$ 0123456789 ãçé')
  ]);

const track = (name: string, promise: Promise<unknown>): Promise<[string, number]> =>
  promise.then(() => {
    const at = Math.round(performance.now());
    performance.mark(`ke:${name}`);
    return [name, at];
  });

// Dispara tudo que é crítico de uma vez e libera o splash quando animação E app estiverem prontos.
// O splash tem timeout de segurança próprio (6 s, no index.html), então nada aqui pode travar a abertura para sempre.
export const startup = () => {
  const critical = Promise.all([
    track('banco', boot()),
    track('fonte', loadFonts()),
    track('telas', prefetchRoutes()),
    track('render', rendered)
  ]);

  const splash = window.__splash;
  critical.then((marks) => {
    performance.mark('ke:app-pronto');
    if (import.meta.env.DEV) report(marks);
    if (splash) splash.finished.then(splash.hide);
  });
};

const report = (marks: [string, number][]) => {
  const total = Math.max(...marks.map(([, at]) => at));
  const sorted = [...marks].sort((a, b) => b[1] - a[1]);
  console.info(
    `[abertura] app pronto em ${total} ms (meta ${BUDGET_MS} ms)`,
    Object.fromEntries(marks.map(([name, at]) => [name, `${at} ms`]))
  );
  if (total > BUDGET_MS) {
    console.warn(`[abertura] acima da meta: o que mais pesa é "${sorted[0][0]}" (${sorted[0][1]} ms). Candidatos: code-splitting, lazy, cache.`);
  }
};
