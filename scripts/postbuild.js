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

function copyFile(sourceRelative, destinationRelative) {
  const source = path.join(rootDir, sourceRelative);
  const destination = path.join(rootDir, destinationRelative);

  if (!existsSync(source)) {
    console.warn(`[postbuild] Skipping missing source file: ${sourceRelative}`);
    return;
  }

  ensureDir(path.dirname(destination));
  cpSync(source, destination);
  console.log(`[postbuild] Copied file ${sourceRelative} -> ${destinationRelative}`);
}

ensureDir(distDir);

copyFolder('admin', path.join('dist', 'admin'));
console.log("Decap: using /admin/config.yml as single source of truth");
copyFile(path.join('admin', 'config.yml'), path.join('site', 'admin', 'config.yml'));
copyFolder('site', path.join('dist', 'site'));
