import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SOURCE_DIR = path.join(rootDir, 'content');
const TARGET_DIR = path.join(rootDir, '.netlify', 'visual-editor', 'content');
const UPLOADS_DIRNAME = 'uploads';

const ensureDir = (directory) => {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
};

export const prepareVisualEditorContent = () => {
  ensureDir(path.dirname(TARGET_DIR));

  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`prepare-visual-editor-content: source directory not found at ${SOURCE_DIR}`);
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

  console.log(`[prepare-visual-editor-content] Copied content/ -> .netlify/visual-editor/content/ (skipped ${UPLOADS_DIRNAME}/)`);
};

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  prepareVisualEditorContent();
}
