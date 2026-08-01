#!/usr/bin/env node
/**
 * Build a Hostinger upload zip.
 *
 * Layout inside zip (extract into public_html/bookworm/):
 *
 *   .htaccess          ← Vue SPA (skips /backend)
 *   backend/           ← PHP API  → https://ajarafashion.com/bookworm/backend
 *     app/, lib/, public/, tmp/
 *     .env, .env.production, .htaccess
 *   index.html…        ← optional, with --with-web
 *
 * Local development is unchanged:
 *   PHP:  backend-php/scripts/serve.sh  → http://127.0.0.1:3080
 *   Vue:  frontend npm run dev          → http://127.0.0.1:5173  (base /)
 *
 * Usage:
 *   npm run pack              # API only (+ SPA .htaccess placeholder root)
 *   npm run pack:web          # API + frontend production build
 */

import {
  existsSync,
  mkdirSync,
  rmSync,
  cpSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPO = join(ROOT, '..');
const FRONTEND = join(REPO, 'frontend');
const DIST = join(ROOT, 'dist');
const STAGE = join(DIST, 'stage');
const API_STAGE = join(STAGE, 'backend');
const OUT_ZIP = join(DIST, 'bookworm-hostinger.zip');

const WITH_WEB = process.argv.includes('--with-web');
const INCLUDE_DIRS = ['app', 'lib', 'public'];

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function ensureProductionEnv() {
  const prodPath = join(ROOT, '.env.production');
  if (!existsSync(prodPath)) {
    fail('Missing .env.production — copy from .env.production.example and fill secrets.');
  }
  let text = readFileSync(prodPath, 'utf8');
  if (/CHANGE_ME/.test(text)) {
    fail('.env.production still has CHANGE_ME — set real DB password before packing.');
  }
  // Force Hostinger API base under /bookworm/backend
  if (!/^APP_BASE=/m.test(text)) {
    text += '\nAPP_BASE=/bookworm/backend\n';
  } else {
    text = text.replace(/^APP_BASE=.*$/m, 'APP_BASE=/bookworm/backend');
  }
  return text.endsWith('\n') ? text : `${text}\n`;
}

function copyDirFiltered(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    if (name === '.DS_Store' || name === 'node_modules') continue;
    const from = join(src, name);
    const to = join(dest, name);
    const st = statSync(from);
    if (st.isDirectory()) copyDirFiltered(from, to);
    else cpSync(from, to);
  }
}

function buildFrontend() {
  console.log('Building frontend (vite -- mode production, base /bookworm/)…');
  const r = spawnSync('npm', ['run', 'build'], {
    cwd: FRONTEND,
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ensure production API URL during build if .env.production exists
    },
  });
  if (r.status !== 0) fail('Frontend build failed');
  const outDir = join(FRONTEND, 'dist');
  if (!existsSync(join(outDir, 'index.html'))) {
    fail('frontend/dist/index.html missing after build');
  }
  return outDir;
}

function main() {
  console.log(
    WITH_WEB
      ? 'Packing BookWorm web + PHP API for Hostinger…'
      : 'Packing BookWorm PHP API for Hostinger (backend/ only)…',
  );

  const prodEnv = ensureProductionEnv();

  rmSync(STAGE, { recursive: true, force: true });
  mkdirSync(API_STAGE, { recursive: true });
  mkdirSync(join(API_STAGE, 'tmp'), { recursive: true });
  writeFileSync(join(API_STAGE, 'tmp/.gitkeep'), '');

  for (const dir of INCLUDE_DIRS) {
    const src = join(ROOT, dir);
    if (!existsSync(src)) fail(`Missing folder: ${dir}/`);
    copyDirFiltered(src, join(API_STAGE, dir));
  }

  const backendHt = join(ROOT, 'htaccess-backend-root.txt');
  if (!existsSync(backendHt)) fail('Missing htaccess-backend-root.txt');
  cpSync(backendHt, join(API_STAGE, '.htaccess'));

  // Hostinger: one self-contained .env (no .env.development in the zip).
  // Locally we still use .env + .env.development / .env.production.
  writeFileSync(join(API_STAGE, '.env'), prodEnv);
  // Keep switcher-compatible copy too (harmless; loader prefers APP_ENV file if present)
  writeFileSync(join(API_STAGE, '.env.production'), prodEnv);


  const webHt = join(ROOT, 'htaccess-bookworm-web.txt');
  if (!existsSync(webHt)) fail('Missing htaccess-bookworm-web.txt');
  cpSync(webHt, join(STAGE, '.htaccess'));

  if (WITH_WEB) {
    const frontDist = buildFrontend();
    for (const name of readdirSync(frontDist)) {
      if (name === '.DS_Store') continue;
      cpSync(join(frontDist, name), join(STAGE, name), { recursive: true });
    }
  }

  writeFileSync(
    join(STAGE, 'UPLOAD.txt'),
    [
      'Extract into: public_html/bookworm/',
      '',
      'Result:',
      '  bookworm/.htaccess          (SPA — ignores /backend)',
      '  bookworm/index.html         (if packed with --with-web)',
      '  bookworm/backend/           (PHP API)',
      '',
      'Web:  https://ajarafashion.com/bookworm/',
      'API:  https://ajarafashion.com/bookworm/backend',
      'Test: https://ajarafashion.com/bookworm/backend/health',
      '',
      'If upgrading from old layout, remove old bookworm/app, bookworm/public, etc.',
      '',
    ].join('\n'),
  );

  rmSync(OUT_ZIP, { force: true });
  const zip = spawnSync('zip', ['-r', '-q', OUT_ZIP, '.'], {
    cwd: STAGE,
    stdio: 'inherit',
  });
  if (zip.status !== 0) fail('zip command failed — is `zip` installed?');

  // Keep an unzipped copy for CI / FTP deploy (and local inspection)
  const deployDir = join(DIST, 'deploy');
  rmSync(deployDir, { recursive: true, force: true });
  cpSync(STAGE, deployDir, { recursive: true });
  rmSync(STAGE, { recursive: true, force: true });

  const kb = (statSync(OUT_ZIP).size / 1024).toFixed(1);
  console.log(`✔ Created ${relative(ROOT, OUT_ZIP)} (${kb} KiB)`);
  console.log(`✔ Deploy folder ${relative(ROOT, deployDir)}/`);
  console.log('  API path:  /bookworm/backend  (local serve.sh still http://127.0.0.1:3080)');
  if (WITH_WEB) console.log('  Web path:  /bookworm/');
  console.log('\nUpload → public_html/bookworm/ → Extract  (or FTP dist/deploy/)');
}

main();
