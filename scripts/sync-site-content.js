import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(rootDir, 'content');
const TARGET_DIR = path.join(rootDir, 'site', 'content');
const UPLOADS_DIRNAME = 'uploads';
const PLACEHOLDER_README = `# Kapunka Upload Mirror\n\nBinary assets are intentionally excluded from this mirror to keep pull requests lightweight.\n\n- Canonical files remain in content/uploads/ and are served in production.\n- Editors can replace these placeholders by restoring the real assets once the Visual Editor accepts binaries again.\n- Leave this README (and the empty .gitkeep) in place so the folder stays tracked.\n`;

const ensureDir = (directory) => {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
};

const ensureUploadsPlaceholder = () => {
  const uploadsDir = path.join(TARGET_DIR, UPLOADS_DIRNAME);
  ensureDir(uploadsDir);

  const readmePath = path.join(uploadsDir, 'README.txt');
  writeFileSync(readmePath, PLACEHOLDER_README);

  const gitkeepPath = path.join(uploadsDir, '.gitkeep');
  if (!existsSync(gitkeepPath)) {
    writeFileSync(gitkeepPath, '');
  }
};

export const syncSiteContent = () => {
  ensureDir(path.dirname(TARGET_DIR));

  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`sync-site-content: source directory not found at ${SOURCE_DIR}`);
  }

  rmSync(TARGET_DIR, { recursive: true, force: true });
  cpSync(SOURCE_DIR, TARGET_DIR, {
    recursive: true,
    filter: (sourcePath) => {
      const relativePath = path.relative(SOURCE_DIR, sourcePath);

      if (!relativePath) {
        return true;
      }

      const [firstSegment] = relativePath.split(path.sep);
      return firstSegment !== UPLOADS_DIRNAME;
    },
  });

  ensureUploadsPlaceholder();
  console.log(`[sync-site-content] Synced content/ -> site/content/ (skipped ${UPLOADS_DIRNAME}/)`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  syncSiteContent();
}
