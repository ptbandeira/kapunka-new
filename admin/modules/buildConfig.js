
#!/usr/bin/env node
import { readFileSync } from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const configPath = path.resolve('admin/config.base.yml');
const anchorsPath = path.resolve('admin/modules/anchors.yaml');
const targetPath = path.resolve('admin/config.yml');

const anchors = yaml.load(readFileSync(anchorsPath, 'utf8')) || {};
const base = yaml.load(readFileSync(configPath, 'utf8')) || {};
const merged = Object.assign({}, anchors, base);
const serialized = yaml.dump(merged, { lineWidth: 120 });

console.log(`# Run this script to regenerate admin/config.yml`);
console.log(serialized);
