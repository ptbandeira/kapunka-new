import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(rootDir, 'content');
const PUBLIC_CONTENT_DIR = path.join(rootDir, 'public', 'content');
const SITE_CONTENT_DIR = path.join(rootDir, 'site', 'content');

function ensureDir(directory) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function copyContent(destination) {
  rmSync(destination, { recursive: true, force: true });
  ensureDir(path.dirname(destination));
  cpSync(SOURCE_DIR, destination, { recursive: true });
}

if (!existsSync(SOURCE_DIR)) {
  console.warn('[sync-static-content] Skipping copy because content directory is missing.');
  process.exit(0);
}

copyContent(PUBLIC_CONTENT_DIR);
console.log('[sync-static-content] Copied content -> public/content');

copyContent(SITE_CONTENT_DIR);
console.log('[sync-static-content] Copied content -> site/content');
