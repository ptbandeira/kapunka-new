import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function ensureDir(directory) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

function copyFolder(sourceRelative, destinationRelative) {
  const source = path.join(rootDir, sourceRelative);
  const destination = path.join(rootDir, destinationRelative);

  if (!existsSync(source)) {
    console.warn(`[postbuild] Skipping missing source: ${sourceRelative}`);
    return;
  }

  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });
  console.log(`[postbuild] Copied ${sourceRelative} -> ${destinationRelative}`);
}

ensureDir(distDir);

copyFolder('content', path.join('dist', 'content'));
copyFolder('admin', path.join('dist', 'admin'));
