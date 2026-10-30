# Ke Gestão

Gestão de vendas, estoque e clientes para consultoras de cosméticos. Funciona **offline** (dados só no aparelho,
em IndexedDB) e roda como **PWA** e como **APK** (Capacitor). Especificação e decisões: `ke-gestao-blueprint.md`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build do PWA (service worker com pré-cache) em `dist/` |
| `npm run preview` | serve o `dist/` (use depois de recompilar) |
| `npm test` | testes do núcleo e dos serviços (Vitest) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build:android` | build web para o APK + `cap sync` + alterações de `android/` |
| `npm run apk:debug` | gera `release/ke-gestao-<versão>-debug.apk` |
| `npm run apk:release` | gera `release/ke-gestao-<versão>-release.apk` (assinado, R8 + shrink) |
| `npm run android:keystore` | cria a chave de assinatura (uma vez) |

## APK (Android)

**Pré-requisitos:** JDK 21 (`JAVA_HOME`), Android SDK com a plataforma 36 (`ANDROID_HOME`) e `adb`.

```bash
npm run apk:release          # a 1ª vez cria a chave e baixa o Gradle (alguns minutos)
adb devices                  # o aparelho precisa aparecer (depuração USB)
adb install -r release/ke-gestao-1.5.0-release.apk   # -r mantém os dados
```

Sem cabo: copie o `.apk` para o celular e abra (também funciona por cima da versão instalada).
Para depurar a WebView: cabo + `chrome://inspect` (no `release` a depuração fica desligada; use o `debug`).

- **Não mude `appId` (`com.kegestao.app`)** em `capacitor.config.ts`: o Android trataria como outro app e o
  instalado não seria atualizado. Renomear o produto é só texto de tela, manifest e `strings.xml`.
- **Chave de assinatura:** fica em `~/.kegestao/` (fora do projeto e do git). **Faça backup**: sem ela não dá para
  atualizar o app já instalado.
- `npm run build` (web) e `npm run build:android` escrevem no mesmo `dist/`. Quem publica na web depois de um build
  do Android **roda o build web de novo**.
- No APK não há service worker nem checagem de atualização por `version.json` (o app já está em disco). Isso é
  decisão de **build** (`VITE_ANDROID=1`), não de execução.
- `versionName` vem do `package.json`; `versionCode` é o número de commits (sempre sobe).

### O que o projeto altera em `android/`

`android/` é **gerado** (`npm run android:init`) e não é versionado. Tudo que é nosso está em `native/android/` e
`scripts/android-patch.mjs`, que reaplica de forma idempotente depois de cada `cap sync`:

1. `WindowColorsPlugin.java` (plugin local) e `MainActivity.java` (registra o plugin **antes** de `super.onCreate`):
   cor do fundo da janela, do fundo atrás da WebView e dos ícones das barras de status/gestos, seguindo o tema do app.
2. `res/values/styles.xml`: tema de abertura **preto, estático e sem ícone** (a animação do batom roda na web, por cima).
3. `res/mipmap-*` e `ic_launcher_background`: ícone do batom (legado, redondo e adaptativo; gerado por
   `scripts/make-android-icons.ps1` a partir de `design/icone_batom.png`).
4. Removidos os `drawable*/splash.png` do template (não usados).
5. `app/build.gradle`: versão, assinatura, `minifyEnabled` + `shrinkResources` (R8), só os idiomas `en` e `pt-BR`.
6. `proguard-rules.pro`: regras para o plugin local. `gradle.properties`: 2 GB de memória, build em paralelo/cache.
7. `AndroidManifest.xml`: `usesCleartextTraffic="false"`.

## Abertura (splash)

Animação do batom de 2 s no `index.html` (ajustes em `CFG` no script e nos `fill` do SVG). O app carrega em paralelo
(`services/startup.ts`); a splash sai quando a animação **e** o app estiverem prontos (timeout de 6 s). Medidas de
abertura: marcas `ke:*` e `splash:*` em `performance.getEntriesByType('mark')`. Para testes de tela, desligue a
splash com `localStorage['ke:sem-splash'] = '1'`.
