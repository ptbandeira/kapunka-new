#!/usr/bin/env node
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const pagesDir = path.join(root, 'content', 'pages');
const collections = {
  products: { path: path.join(root, 'content', 'products', 'index.json'), key: 'items' },
  articles: { path: path.join(root, 'content', 'articles', 'index.json'), key: 'items' },
  courses: { path: path.join(root, 'content', 'courses.json'), key: 'courses' },
  videos: { path: path.join(root, 'content', 'videos.json'), key: 'videos' },
  training: { path: path.join(root, 'content', 'training.json'), key: 'trainings' },
};

function parseFrontMatter(content) {
  if (!content.startsWith('---')) {
    return {};
  }

  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return {};
  }

  const block = content.slice(3, endIndex).trim();
  const result = {};

  block.split(/\n+/).forEach((line) => {
    const [key, ...rest] = line.split(':');
    if (!key || rest.length === 0) {
      return;
    }
    const value = rest.join(':').trim();
    if (!value) {
      result[key.trim()] = '';
      return;
    }
    if (value === 'true' || value === 'false') {
      result[key.trim()] = value === 'true';
      return;
    }
    if (!Number.isNaN(Number(value))) {
      result[key.trim()] = Number(value);
      return;
    }
    result[key.trim()] = value.replace(/^"|"$/g, '');
  });

  return result;
}

async function collectPages() {
  const locales = await readdir(pagesDir);
  const results = [];

  for (const locale of locales) {
    const localeDir = path.join(pagesDir, locale);
    const entries = await readdir(localeDir);
    for (const entry of entries) {
      if (!entry.endsWith('.md')) {
        continue;
      }
      const filePath = path.join(localeDir, entry);
      const content = await readFile(filePath, 'utf8');
      const frontMatter = parseFrontMatter(content);
      const fileStat = await stat(filePath);
      results.push({
        type: 'page',
        locale,
        file: path.relative(root, filePath),
        status: frontMatter.status || 'unknown',
        scheduling: frontMatter.scheduling || null,
        visible: typeof frontMatter.visible === 'boolean' ? frontMatter.visible : undefined,
        updatedAt: fileStat.mtime.toISOString(),
      });
    }
  }

  return results;
}

async function collectCollections() {
  const output = [];

  for (const [name, config] of Object.entries(collections)) {
    try {
      const raw = await readFile(config.path, 'utf8');
      const data = JSON.parse(raw);
      const items = Array.isArray(data[config.key]) ? data[config.key] : [];
      items.forEach((item) => {
        output.push({
          type: name,
          id: item.id || item.slug || item.courseTitle || null,
          status: item.status || 'unknown',
          scheduling: item.scheduling || null,
        });
      });
    } catch (error) {
      console.warn(`[content-audit] Failed to read ${config.path}:`, error.message);
    }
  }

  return output;
}

async function run() {
  const pages = await collectPages();
  const collections = await collectCollections();
  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      pages: pages.length,
      collections: collections.length,
    },
    pages,
    collections,
  };

  const analyticsDir = path.join(root, 'analytics');
  await mkdir(analyticsDir, { recursive: true });
  const outputPath = path.join(analyticsDir, 'content-audit.json');
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`[content-audit] Wrote ${outputPath}`);
}

run().catch((error) => {
  console.error('[content-audit] Failed to generate audit report:', error);
  process.exit(1);
});
