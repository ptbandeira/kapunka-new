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

function relaxFieldValidation(config) {
  function allowOptional(node) {
    if (Array.isArray(node)) {
      node.forEach(allowOptional);
      return;
    }

    if (!node || typeof node !== 'object') {
      return;
    }

    if (typeof node.widget === 'string') {
      node.required = false;

      if (Array.isArray(node.pattern) && typeof node.pattern[0] === 'string') {
        const [patternValue] = node.pattern;
        try {
          const pattern = new RegExp(patternValue);
          if (!pattern.test('')) {
            const startsAnchored = patternValue.startsWith('^');
            const endsAnchored = patternValue.endsWith('$');
            const bodyStart = startsAnchored ? 1 : 0;
            const bodyEnd = endsAnchored ? patternValue.length - 1 : patternValue.length;
            const body = patternValue.slice(bodyStart, bodyEnd);
            node.pattern[0] = `^(?:${body}|)$`;
          }
        } catch (error) {
          console.warn(`Unable to relax pattern "${patternValue}": ${error.message}`);
        }
      }
    }

    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach(allowOptional);
      } else if (value && typeof value === 'object') {
        allowOptional(value);
      }
    });
  }

  allowOptional(config);
}

function mergeModules() {
  const anchorsRaw = readFile(ANCHORS_PATH);
  const mainRaw = readFile(MAIN_PATH);
  const mergedRaw = `${anchorsRaw}\n${mainRaw}`;

  const config = yaml.load(mergedRaw, { json: true }) || {};

  relaxFieldValidation(config);
  applyPerformanceDefaults(config);
  validateConfig(config);

  const serialized = dumpYaml(config);
  fs.writeFileSync(OUTPUT_PATH, serialized, 'utf8');
  console.log(`✔ Wrote ${path.relative(ROOT, OUTPUT_PATH)} (${serialized.split('\n').length} lines)`);
}

mergeModules();
