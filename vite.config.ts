import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { defineConfig, loadEnv, Plugin } from 'vite';
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const git = getGitInfo();
  const version = readPkgVersion();
  const buildTime = new Date().toISOString();

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), versionJsonPlugin(version, git, buildTime)],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
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
