import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

interface GitInfo {
  commit: string;
  commitShort: string;
  message: string;
  date: string;
}

function getGitInfo(): GitInfo {
  const safe = (cmd: string) => {
    try {
      return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      return '';
    }
  };
  return {
    commit: safe('git rev-parse HEAD') || 'unknown',
    commitShort: safe('git rev-parse --short HEAD') || 'unknown',
    message: safe('git log -1 --pretty=%s'),
    date: safe('git log -1 --pretty=%cI')
  };
}

function readPkgVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function versionJsonPlugin(version: string, git: GitInfo, buildTime: string): Plugin {
  const payload = () => JSON.stringify({
    version,
    commit: git.commit,
    commitShort: git.commitShort,
    message: git.message,
    date: git.date,
    buildTime
  });

  return {
    name: 'ke-gestao-version-json',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.end(payload());
      });
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      if (fs.existsSync(outDir)) {
        fs.writeFileSync(path.join(outDir, 'version.json'), payload());
      }
    }
  };
}

/**
 * Gera a lista de pré-cache do service worker a partir do que o build realmente emitiu
 * (JS/CSS com hash, fonte, ícones, manifest). Sem isso, as views carregadas sob demanda e a
 * fonte só ficariam offline se o usuário as tivesse aberto antes.
 */
function precachePlugin(): Plugin {
  let outDir = '';
  return {
    name: 'ke-gestao-precache',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const swPath = path.join(outDir, 'sw.js');
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(swPath) || !fs.existsSync(indexPath)) return;

      const files: string[] = [];
      const walk = (dir: string) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else files.push('/' + path.relative(outDir, full).split(path.sep).join('/'));
        }
      };
      walk(outDir);

      const skip = new Set(['/sw.js', '/version.json', '/index.html']);
      const list = ['/', ...files.filter(f => !skip.has(f) && !f.endsWith('.map')).sort()];
      const buildId = createHash('sha1')
        .update(list.join('\n'))
        .update(fs.readFileSync(indexPath))
        .digest('hex')
        .slice(0, 10);

      const template = fs.readFileSync(swPath, 'utf-8');
      const filled = template
        .replace("const BUILD_ID = 'dev';", `const BUILD_ID = '${buildId}';`)
        .replace('const PRECACHE = [];', `const PRECACHE = ${JSON.stringify(list)};`);
      if (filled === template || !filled.includes(buildId)) {
        throw new Error('ke-gestao-precache: placeholders não encontrados em public/sw.js');
      }
      fs.writeFileSync(swPath, filled);
    }
  };
}

export default defineConfig(() => {
  const git = getGitInfo();
  const version = readPkgVersion();
  const buildTime = new Date().toISOString();

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), versionJsonPlugin(version, git, buildTime), precachePlugin()],
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __APP_COMMIT__: JSON.stringify(git.commit),
      __APP_COMMIT_SHORT__: JSON.stringify(git.commitShort),
      __APP_COMMIT_MESSAGE__: JSON.stringify(git.message),
      __APP_COMMIT_DATE__: JSON.stringify(git.date),
      __APP_BUILD_TIME__: JSON.stringify(buildTime)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
