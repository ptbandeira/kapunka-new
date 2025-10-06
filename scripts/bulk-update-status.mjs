#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const argMap = new Map();
process.argv.slice(2).forEach((entry) => {
  const [rawKey, rawValue] = entry.split('=');
  const key = rawKey.replace(/^--/, '');
  const value = rawValue ?? 'true';
  argMap.set(key, value);
});

const collection = argMap.get('collection');
const status = argMap.get('status');
const publishAt = argMap.get('publishAt');
const unpublishAt = argMap.get('unpublishAt');
const ids = argMap.has('ids') ? argMap.get('ids').split(',').map((value) => value.trim()).filter(Boolean) : null;

if (!collection) {
  console.error('[bulk-update-status] Missing required --collection value.');
  process.exitCode = 1;
  process.exit(1);
}

if (!status) {
  console.error('[bulk-update-status] Missing required --status value.');
  process.exitCode = 1;
  process.exit(1);
}

const COLLECTION_MAP = {
  products: { path: 'content/products/index.json', key: 'items' },
  articles: { path: 'content/articles/index.json', key: 'items' },
  courses: { path: 'content/courses.json', key: 'courses' },
  videos: { path: 'content/videos.json', key: 'videos' },
  training: { path: 'content/training.json', key: 'trainings' },
};

const config = COLLECTION_MAP[collection];
if (!config) {
  console.error(`[bulk-update-status] Unknown collection "${collection}". Use one of: ${Object.keys(COLLECTION_MAP).join(', ')}`);
  process.exitCode = 1;
  process.exit(1);
}

const targetPath = resolve(config.path);

const createScheduling = () => {
  if (!publishAt && !unpublishAt) {
    return undefined;
  }
  const scheduling = {};
  if (publishAt) {
    scheduling.publishAt = publishAt;
  }
  if (unpublishAt) {
    scheduling.unpublishAt = unpublishAt;
  }
  return scheduling;
};

const run = async () => {
  const fileContents = await readFile(targetPath, 'utf8');
  const data = JSON.parse(fileContents);
  const entries = Array.isArray(data[config.key]) ? data[config.key] : [];

  if (entries.length === 0) {
    console.warn(`[bulk-update-status] No entries found in ${config.path}.`);
    return;
  }

  let updated = 0;
  const scheduling = createScheduling();

  for (const entry of entries) {
    if (ids && ids.length > 0) {
      const entryId = entry.id || entry.slug || entry.courseTitle;
      if (!entryId || !ids.includes(String(entryId))) {
        continue;
      }
    }

    entry.status = status;
    if (scheduling) {
      entry.scheduling = { ...entry.scheduling, ...scheduling };
    }
    updated += 1;
  }

  if (updated === 0) {
    console.warn('[bulk-update-status] No entries matched the provided filters.');
    return;
  }

  const formatted = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(targetPath, formatted, 'utf8');
  console.log(`[bulk-update-status] Updated ${updated} ${collection} entr${updated === 1 ? 'y' : 'ies'} in ${config.path}.`);
};

run().catch((error) => {
  console.error('[bulk-update-status] Failed to update content:', error);
  process.exitCode = 1;
  process.exit(1);
});
