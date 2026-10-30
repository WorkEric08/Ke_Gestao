// Os dois valores abaixo são preenchidos no build (precachePlugin em vite.config.ts).
const BUILD_ID = 'dev';
const PRECACHE = [];

const CACHE_PREFIX = 'kegestao-';
const CACHE_NAME = CACHE_PREFIX + BUILD_ID;

// Instalação: pré-cacheia o app inteiro (shell, JS/CSS com hash, fonte, ícones).
// Depois da primeira visita nada mais depende da rede.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Arquivos com hash no nome nunca mudam: podem sair do cache HTTP (o prefetch da abertura já os baixou),
      // senão a primeira visita baixaria cada pedaço duas vezes. O resto (shell, manifest) vem fresco.
      cache.addAll(PRECACHE.map((url) => new Request(url, { cache: url.startsWith('/assets/') ? 'default' : 'reload' })))
    )
  );
  self.skipWaiting();
});

// Ativação: remove os caches de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME).map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

// Permite à página acionar a ativação imediata do novo SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // /version.json sempre sai pela rede — é o sinal usado para detectar update disponível.
  if (url.pathname === '/version.json') {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => Response.error()));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Navegação: o shell pré-cacheado abre na hora (e offline). Versão nova entra pelo update do SW.
    if (request.mode === 'navigate') {
      return (await cache.match('/')) || fetch(request);
    }

    // Demais arquivos: cache primeiro (os de /assets têm hash no nome, nunca mudam).
    // ignoreVary: o import() de módulo manda `Origin` e o servidor responde `Vary: Origin`,
    // o que faria o match falhar mesmo com o arquivo no cache.
    const hit = await cache.match(request, { ignoreVary: true });
    if (hit) return hit;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  })());
});
