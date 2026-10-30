// Orquestra o APK:  node scripts/android.mjs <init|build|apk debug|apk release|keystore>
// (atalhos no package.json: android:init, build:android, apk:debug, apk:release, android:keystore)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { patchAndroid } from './android-patch.mjs';

const root = path.resolve(import.meta.dirname, '..');
const android = path.join(root, 'android');
const dist = path.join(root, 'dist');
const isWin = process.platform === 'win32';

const run = (cmd, args, options = {}) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, cwd: root, ...options, env: { ...process.env, ...options.env } });
  if (result.status !== 0) {
    console.error(`\n✗ falhou: ${cmd} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
};

// Apaga e CONFERE: um arquivo preso (antivírus, outro processo) deixaria lixo velho dentro do APK sem avisar.
const clean = (dir) => {
  fs.rmSync(dir, { recursive: true, force: true });
  if (fs.existsSync(dir)) {
    console.error(`✗ não consegui apagar ${path.relative(root, dir)}. Feche o que estiver usando a pasta e tente de novo.`);
    process.exit(1);
  }
};

const version = () => JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;

// ---------- init ----------
const init = () => {
  if (!fs.existsSync(path.join(android, 'app'))) {
    console.log('→ criando o projeto Android (cap add android)');
    // o `cap add` exige o webDir (dist) existente, mesmo vazio
    fs.mkdirSync(dist, { recursive: true });
    if (!fs.existsSync(path.join(dist, 'index.html'))) fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html>');
    run('npx', ['cap', 'add', 'android']);
  }
  console.log('→ aplicando as alterações do projeto em android/');
  for (const change of patchAndroid()) console.log('  ✓', change);
};

// ---------- build (web para o APK + cap sync + patch) ----------
const build = () => {
  init();
  console.log('→ build web para o APK (VITE_ANDROID=1: sem service worker)');
  clean(dist);
  run('npx', ['vite', 'build'], { env: { VITE_ANDROID: '1' } });
  // No APK o app já está em disco: o service worker e o version.json (checagem de atualização da web) só pesam.
  for (const file of ['sw.js', 'version.json']) {
    fs.rmSync(path.join(dist, file), { force: true });
    if (fs.existsSync(path.join(dist, file))) {
      console.error(`✗ não consegui remover dist/${file}`);
      process.exit(1);
    }
  }
  // O `cap sync` copia o dist/ mas não apaga o que sobrou de sincronizações anteriores (sw.js, pedaços com hash
  // antigos...). Esvazia antes, senão o APK carrega arquivo morto.
  clean(path.join(android, 'app', 'src', 'main', 'assets', 'public'));
  console.log('→ cap sync android');
  run('npx', ['cap', 'sync', 'android']);
  patchAndroid();
};

// ---------- keystore ----------
const keyDir = path.join(os.homedir(), '.kegestao');
const keyProps = path.join(keyDir, 'keystore.properties');

const ensureKeystore = () => {
  if (fs.existsSync(keyProps)) return;
  fs.mkdirSync(keyDir, { recursive: true });
  const keystore = path.join(keyDir, 'release.keystore');
  const password = crypto.randomBytes(18).toString('base64url');
  const keytool = path.join(process.env.JAVA_HOME ?? '', 'bin', isWin ? 'keytool.exe' : 'keytool');
  console.log('→ criando a chave de assinatura (uma vez só) em', keyDir);
  const result = spawnSync(
    fs.existsSync(keytool) ? `"${keytool}"` : 'keytool',
    ['-genkeypair', '-v', '-keystore', `"${keystore}"`, '-alias', 'kegestao', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
      '-storepass', password, '-keypass', password, '-dname', '"CN=Ke Gestao, O=Ke Gestao, C=BR"'],
    { stdio: 'inherit', shell: true }
  );
  if (result.status !== 0) {
    console.error('✗ não foi possível criar a chave (keytool). Confira o JAVA_HOME.');
    process.exit(1);
  }
  fs.writeFileSync(keyProps, `storeFile=${keystore.replace(/\\/g, '/')}\nstorePassword=${password}\nkeyAlias=kegestao\nkeyPassword=${password}\n`);
  console.log(`
  ⚠ FAÇA BACKUP de ${keyDir}
    Sem esta chave não dá para publicar atualizações do app já instalado (o Android recusa uma assinatura diferente).
    Ela fica fora do projeto e do git de propósito.`);
};

// ---------- apk ----------
const apk = (type) => {
  if (!['debug', 'release'].includes(type)) {
    console.error('uso: apk debug | apk release');
    process.exit(1);
  }
  if (type === 'release') ensureKeystore();
  build();
  console.log(`→ gradle assemble${type === 'debug' ? 'Debug' : 'Release'}`);
  // caminho completo: o cmd do Windows não procura o gradlew na pasta atual
  const gradlew = path.join(android, isWin ? 'gradlew.bat' : 'gradlew');
  run(`"${gradlew}"`, [`assemble${type === 'debug' ? 'Debug' : 'Release'}`], { cwd: android });

  const dir = path.join(android, 'app', 'build', 'outputs', 'apk', type);
  const built = fs.readdirSync(dir).find((f) => f.endsWith('.apk'));
  if (!built) {
    console.error('✗ APK não encontrado em', dir);
    process.exit(1);
  }
  const out = path.join(root, 'release');
  fs.mkdirSync(out, { recursive: true });
  const target = path.join(out, `ke-gestao-${version()}-${type}.apk`);
  fs.copyFileSync(path.join(dir, built), target);
  const kb = Math.round(fs.statSync(target).size / 1024);
  console.log(`\n✓ ${path.relative(root, target)}  (${kb} kB)`);
};

const [command, arg] = process.argv.slice(2);
switch (command) {
  case 'init': init(); break;
  case 'build': build(); break;
  case 'apk': apk(arg); break;
  case 'keystore': ensureKeystore(); console.log('chave em', keyDir); break;
  default:
    console.error('uso: node scripts/android.mjs <init|build|apk debug|apk release|keystore>');
    process.exit(1);
}
