#!/usr/bin/env node
import { readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { load as parseYaml } from 'js-yaml';

const LOCALES = ['en', 'pt', 'es'];
const PAGES_DIR = join(process.cwd(), 'content', 'pages');

const REQUIRED_KEYS = ['metaTitle', 'metaDescription'];

function parseFrontmatter(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) {
    return {};
  }
  try {
    return parseYaml(match[1]) || {};
  } catch (error) {
    console.error(`Failed to parse frontmatter for ${filePath}:`, error);
    return {};
  }
}

function collectPageSlugs() {
  return readdirSync(join(PAGES_DIR, 'en'))
    .filter((filename) => filename.endsWith('.md'))
    .map((filename) => basename(filename));
}

function isEmptyValue(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

function audit() {
  const slugs = collectPageSlugs();
  const issues = [];

  slugs.forEach((slug) => {
    LOCALES.forEach((locale) => {
      const filePath = join(PAGES_DIR, locale, slug);
      try {
        const data = parseFrontmatter(filePath);
        REQUIRED_KEYS.forEach((key) => {
          if (isEmptyValue(data[key])) {
            issues.push({
              file: `${locale}/${slug}`,
              key,
              message: 'Missing or empty value',
            });
          }
        });
      } catch (error) {
        issues.push({
          file: `${locale}/${slug}`,
          key: 'frontmatter',
          message: `Failed to read file: ${error.message}`,
        });
      }
    });
  });

  if (issues.length === 0) {
    console.log('✅ All translated pages include the required metadata fields.');
    return;
  }

  console.log('⚠️  Found translation gaps:\n');
  issues.forEach((issue) => {
    console.log(`- ${issue.file} → ${issue.key}: ${issue.message}`);
  });
  console.log('\nAdd the missing values in Decap or via your editor to keep locales aligned.');
}

audit();
