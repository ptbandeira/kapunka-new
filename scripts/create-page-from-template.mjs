#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';

const defaults = {
  locale: 'en',
};

const args = new Map();
for (const arg of process.argv.slice(2)) {
  const [rawKey, rawValue] = arg.split('=');
  const key = rawKey.replace(/^--/, '');
  args.set(key, rawValue ?? '');
}

const slug = args.get('slug');
const locale = args.get('locale') || defaults.locale;
const title = args.get('title') || slug?.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

if (!slug) {
  console.error('[create-page-from-template] Missing required --slug value.');
  process.exit(1);
}

if (!title) {
  console.error('[create-page-from-template] Unable to derive a title. Pass --title to continue.');
  process.exit(1);
}

const templatePath = resolve('content/templates/page-default.md');
const outputPath = resolve(`content/pages/${locale}/${slug}.md`);

const writeFileSafely = async (path, contents) => {
  try {
    await writeFile(path, contents, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'ENOENT') {
      const dir = dirname(path);
      await mkdir(dir, { recursive: true });
      await writeFile(path, contents, { flag: 'wx' });
      return;
    }
    if (error.code === 'EEXIST') {
      console.error(`[create-page-from-template] File already exists at ${path}. Aborting.`);
      process.exit(1);
    }
    throw error;
  }
};

const run = async () => {
  const template = await readFile(templatePath, 'utf8');
  const now = new Date();
  const isoDate = now.toISOString();

  const populated = template
    .replace(/\{\{TITLE\}\}/g, title)
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{GENERATED_AT\}\}/g, isoDate);

  await writeFileSafely(outputPath, populated);
  console.log(`[create-page-from-template] Created ${outputPath}`);
};

run().catch((error) => {
  console.error('[create-page-from-template] Failed to create page:', error);
  process.exit(1);
});
