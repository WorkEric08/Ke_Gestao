// Aplica ao projeto android/ (gerado pelo `cap add android`, fora do git) tudo que é nosso.
// Idempotente: pode rodar depois de cada `cap sync`/`cap add` sem duplicar nada.
// Cada alteração feita em android/ está aqui; se um dia precisar recriar a pasta, este arquivo a refaz.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const android = path.join(root, 'android');
const native = path.join(root, 'native', 'android');
const app = path.join(android, 'app');
const main = path.join(app, 'src', 'main');
const PKG_DIR = path.join(main, 'java', 'com', 'kegestao', 'app');

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

const copyDir = (from, to) => {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dst);
    else {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
    }
  }
};

const versionName = JSON.parse(read(path.join(root, 'package.json'))).version;
// versionCode sobe a cada commit (o Android só aceita atualizar para um código maior).
const versionCode = (() => {
  try {
    return Math.max(1, Number(execSync('git rev-list --count HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()));
  } catch {
    return 1;
  }
})();

export function patchAndroid() {
  if (!fs.existsSync(android)) throw new Error('android/ não existe: rode `npm run android:init`');
  const changes = [];

  // 1. Plugin local e MainActivity
  write(path.join(PKG_DIR, 'WindowColorsPlugin.java'), read(path.join(native, 'WindowColorsPlugin.java')));
  write(path.join(PKG_DIR, 'MainActivity.java'), read(path.join(native, 'MainActivity.java')));
  changes.push('WindowColorsPlugin.java + MainActivity.java');

  // 2. Recursos: ícones do batom, tema de abertura preto (styles.xml) e fundo do ícone adaptativo
  copyDir(path.join(native, 'res'), path.join(main, 'res'));
  changes.push('res/: ícones, styles.xml (abertura preta sem ícone), ic_launcher_background');

  // 3. Imagens de splash do template: não são usadas (a abertura é preta e sem imagem) e pesam no APK
  const res = path.join(main, 'res');
  for (const dir of fs.readdirSync(res)) {
    if (!dir.startsWith('drawable')) continue;
    const splash = path.join(res, dir, 'splash.png');
    if (fs.existsSync(splash)) fs.rmSync(splash);
  }
  changes.push('removidos drawable*/splash.png');

  // 4. build.gradle do app: versão, assinatura, R8, encolher recursos, idiomas
  const gradleFile = path.join(app, 'build.gradle');
  let gradle = read(gradleFile);
  gradle = gradle.replace(/versionCode \d+/, `versionCode ${versionCode}`).replace(/versionName "[^"]*"/, `versionName "${versionName}"`);

  if (!gradle.includes('// ke-gestao:signing')) {
    gradle = gradle.replace(
      "apply plugin: 'com.android.application'\n",
      `apply plugin: 'com.android.application'

// ke-gestao:signing — chave de assinatura fora do projeto (veja \`npm run android:keystore\`)
def kePropsFile = new File(System.getenv('KEGESTAO_SIGNING') ?: "\${System.getProperty('user.home')}/.kegestao/keystore.properties")
def keProps = new Properties()
if (kePropsFile.exists()) { kePropsFile.withInputStream { keProps.load(it) } }
`
    );
  }
  if (!gradle.includes('// ke-gestao:release')) {
    const releaseBlock = /    buildTypes \{[\s\S]*?\n    \}\n/;
    if (!releaseBlock.test(gradle)) throw new Error('bloco buildTypes não encontrado em app/build.gradle');
    gradle = gradle.replace(
      releaseBlock,
      `    // ke-gestao:release — assinatura, R8 (minifica e otimiza o código) e remoção de recurso não usado
    signingConfigs {
        release {
            if (kePropsFile.exists()) {
                storeFile file(keProps['storeFile'])
                storePassword keProps['storePassword']
                keyAlias keProps['keyAlias']
                keyPassword keProps['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            if (kePropsFile.exists()) { signingConfig signingConfigs.release }
        }
    }
    // Só os idiomas do app: as bibliotecas do AndroidX trazem dezenas de traduções que nunca aparecem.
    androidResources {
        localeFilters += ['en', 'pt-rBR']
    }
`
    );
  }
  write(gradleFile, gradle);
  changes.push(`app/build.gradle: versionName ${versionName}, versionCode ${versionCode}, assinatura, R8, shrinkResources, idiomas`);

  // 5. Regras do R8 para o plugin local
  const proguardFile = path.join(app, 'proguard-rules.pro');
  let proguard = read(proguardFile);
  if (!proguard.includes('# ke-gestao')) {
    proguard += `
# ke-gestao: o R8 não pode renomear/remover o plugin local nem seus métodos chamados pela ponte (por reflexão)
-keepattributes *Annotation*
-keep class com.kegestao.app.WindowColorsPlugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { @com.getcapacitor.PluginMethod public <methods>; }
`;
    write(proguardFile, proguard);
  }
  changes.push('proguard-rules.pro: regras do plugin local');

  // 6. Gradle: mais memória (e libera o caminho com acento) (o R8 pede) e builds paralelos/em cache
  write(
    path.join(android, 'gradle.properties'),
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
android.useAndroidX=true
# O caminho do projeto tem acento ("Ke_Gestão"); o AGP recusa por padrão. Se algum dia o build falhar por causa dele,
# mova o projeto para uma pasta só com ASCII e retire esta linha.
android.overridePathCheck=true
`
  );
  changes.push('gradle.properties');

  // 7. Manifest: sem tráfego sem criptografia (o app só usa o pacote local; links externos abrem fora)
  const manifestFile = path.join(main, 'AndroidManifest.xml');
  let manifest = read(manifestFile);
  if (!manifest.includes('usesCleartextTraffic')) {
    manifest = manifest.replace('<application\n', '<application\n        android:usesCleartextTraffic="false"\n');
    write(manifestFile, manifest);
  }
  changes.push('AndroidManifest.xml: usesCleartextTraffic=false');

  return changes;
}

if (import.meta.filename === process.argv[1] || process.argv[1]?.endsWith('android-patch.mjs')) {
  for (const c of patchAndroid()) console.log('  ✓', c);
}
