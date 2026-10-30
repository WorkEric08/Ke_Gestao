import { AppData } from '../types';
import { emptyData } from '../core/data';
import { KeGestaoDB } from './db';
import { LEGACY_KEY, parseLegacy } from './legacy';
import { createRepository, Repository } from './repository';
import { MANUAL_KEY, THEME_KEY, isThemeValue } from './theme';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const sameSize = (a: AppData, b: AppData) =>
  a.customers.length === b.customers.length &&
  a.products.length === b.products.length &&
  a.sales.length === b.sales.length &&
  a.installments.length === b.installments.length;

// O banco sempre vence: só migra o armazenamento antigo quando o banco nunca foi usado.
// O JSON antigo só é apagado depois de reler o banco e conferir que tudo entrou.
export const loadOrMigrate = async (
  repository: Repository,
  storage: StorageLike,
  now: number
): Promise<AppData> => {
  const existing = await repository.loadAll();
  if (existing) return existing;

  const raw = storage.getItem(LEGACY_KEY);
  const legacy = raw ? parseLegacy(raw, now) : null;
  if (!legacy) return emptyData();

  await repository.importAll(legacy);
  const stored = await repository.loadAll();
  if (!stored || !sameSize(stored, legacy)) return legacy;

  // O tema escolhido à mão morava dentro do JSON antigo; passa para o espelho lido na primeira pintura.
  if (storage.getItem(MANUAL_KEY) === 'true' && isThemeValue(legacy.profile.theme)) {
    storage.setItem(THEME_KEY, legacy.profile.theme);
  }
  storage.removeItem(LEGACY_KEY);
  return stored;
};

export interface Booted {
  repository: Repository | null;
  data: AppData;
  failed: boolean;
}

let booting: Promise<Booted> | null = null;

// Uma abertura só por página: o React em modo estrito monta duas vezes, e duas migrações em paralelo brigariam.
export const boot = (): Promise<Booted> =>
  (booting ??= (async (): Promise<Booted> => {
    try {
      const repository = createRepository(new KeGestaoDB());
      const data = await loadOrMigrate(repository, localStorage, Date.now());
      // Sem isso o navegador pode apagar o banco sob pressão de espaço.
      void navigator.storage?.persist?.();
      return { repository, data, failed: false };
    } catch (e) {
      console.error('Ke Gestão: não foi possível abrir o banco', e);
      // Sem banco o app ainda abre (com o que o JSON antigo tiver), mas avisa que nada será salvo.
      const raw = localStorage.getItem(LEGACY_KEY);
      return { repository: null, data: (raw && parseLegacy(raw, Date.now())) || emptyData(), failed: true };
    }
  })());
