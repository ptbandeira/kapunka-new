#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const ROOT = process.cwd();
const ANCHORS_PATH = path.join(ROOT, 'admin', 'config-modules', 'anchors.yaml');
const MAIN_PATH = path.join(ROOT, 'admin', 'config-modules', 'main.yaml');
const OUTPUT_PATH = path.join(ROOT, 'admin', 'config.yml');

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read ${filePath}: ${error.message}`);
  }
}

function dumpYaml(data) {
  return yaml.dump(data, {
    lineWidth: 120,
    noRefs: false,
    sortKeys: false,
  });
}

function validateConfig(config) {
  const issues = [];

  const collections = config.collections || [];
  const seen = new Set();
  collections.forEach((collection) => {
    const name = collection && collection.name;
    if (!name) {
      issues.push('Collection missing name.');
      return;
    }
    if (seen.has(name)) {
      issues.push(`Duplicate collection name detected: ${name}`);
    }
    seen.add(name);

    if (Array.isArray(collection.files)) {
      collection.files.forEach((file) => {
        if (!file || !file.name) {
          issues.push(`Collection ${name} has a file without a name.`);
        }
      });
    }
  });

  const lazyCollections = new Set(['pages', 'sectionTemplates', 'translations', 'products', 'articles', 'courses', 'videoEntries', 'trainingEntries', 'policies']);
  collections.forEach((collection) => {
    if (lazyCollections.has(collection.name) && collection.load_strategy !== 'lazy') {
      issues.push(`Collection ${collection.name} should specify load_strategy: lazy`);
    }
  });

  if (issues.length > 0) {
    const formatted = issues.map((msg) => ` - ${msg}`).join('\n');
    throw new Error(`Config validation failed:\n${formatted}`);
  }
}

function applyPerformanceDefaults(config) {
  const lazyCollections = new Set(['pages', 'sectionTemplates', 'translations', 'products', 'articles', 'courses', 'videoEntries', 'trainingEntries', 'policies']);
  config.collections = (config.collections || []).map((collection) => {
    if (lazyCollections.has(collection.name)) {
      return { ...collection, load_strategy: 'lazy' };
    }
    return collection;
  });
}

function mergeModules() {
  const anchorsRaw = readFile(ANCHORS_PATH);
  const mainRaw = readFile(MAIN_PATH);
  const mergedRaw = `${anchorsRaw}\n${mainRaw}`;

  const config = yaml.load(mergedRaw, { json: true }) || {};

  applyPerformanceDefaults(config);
  validateConfig(config);

  const serialized = dumpYaml(config);
  fs.writeFileSync(OUTPUT_PATH, serialized, 'utf8');
  console.log(`✔ Wrote ${path.relative(ROOT, OUTPUT_PATH)} (${serialized.split('\n').length} lines)`);
}

mergeModules();
