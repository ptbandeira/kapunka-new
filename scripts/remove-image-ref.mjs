import fs from 'fs/promises';
import path from 'path';

const rootDir = process.cwd();
const contentDirs = [
  path.join(rootDir, 'content'),
  path.join(rootDir, 'site', 'content'),
];
const additionalFiles = [
  path.join(rootDir, 'metadata.json'),
  path.join(rootDir, 'content', 'pages_v2', 'index.json'),
  path.join(rootDir, 'site', 'content', 'pages_v2', 'index.json'),
];

const isJsonFile = (filePath) => filePath.endsWith('.json');

const copyValue = (target, sourceKey, destKey) => {
  if (!(sourceKey in target)) {
    return false;
  }

  const value = target[sourceKey];
  if (
    (target[destKey] === undefined || target[destKey] === null || target[destKey] === '')
    && typeof value === 'string'
    && value !== ''
  ) {
    target[destKey] = value;
    return true;
  }

  return false;
};

const transformNode = (node) => {
  let changed = false;

  if (Array.isArray(node)) {
    for (let index = node.length - 1; index >= 0; index -= 1) {
      const item = node[index];
      if (item && typeof item === 'object' && 'name' in item) {
        const fieldName = item.name;
        if (fieldName === 'imageRef' || fieldName === 'heroImageLeftRef' || fieldName === 'heroImageRightRef' || fieldName === 'heroImageRef') {
          node.splice(index, 1);
          changed = true;
          continue;
        }
      }

      changed = transformNode(item) || changed;
    }
    return changed;
  }

  if (!node || typeof node !== 'object') {
    return false;
  }

  if ('imageRef' in node) {
    const hasImageKey = Object.prototype.hasOwnProperty.call(node, 'image');
    const hasImageUrlKey = Object.prototype.hasOwnProperty.call(node, 'imageUrl');

    if (hasImageKey) {
      copyValue(node, 'imageRef', 'image');
    } else if (hasImageUrlKey) {
      copyValue(node, 'imageRef', 'imageUrl');
    } else {
      copyValue(node, 'imageRef', 'image');
    }

    delete node.imageRef;
    changed = true;
  }

  if ('heroImageLeftRef' in node) {
    if (
      (node.heroImageLeft === undefined || node.heroImageLeft === null || node.heroImageLeft === '')
      && typeof node.heroImageLeftRef === 'string'
      && node.heroImageLeftRef !== ''
    ) {
      node.heroImageLeft = node.heroImageLeftRef;
      changed = true;
    }
    delete node.heroImageLeftRef;
    changed = true;
  }

  if ('heroImageRightRef' in node) {
    if (
      (node.heroImageRight === undefined || node.heroImageRight === null || node.heroImageRight === '')
      && typeof node.heroImageRightRef === 'string'
      && node.heroImageRightRef !== ''
    ) {
      node.heroImageRight = node.heroImageRightRef;
      changed = true;
    }
    delete node.heroImageRightRef;
    changed = true;
  }

  if ('heroImageRef' in node) {
    if (
      (node.heroImage === undefined || node.heroImage === null || node.heroImage === '')
      && typeof node.heroImageRef === 'string'
      && node.heroImageRef !== ''
    ) {
      node.heroImage = node.heroImageRef;
      changed = true;
    }
    delete node.heroImageRef;
    changed = true;
  }

  if (
    typeof node.image === 'string'
    && typeof node.imageUrl === 'string'
    && node.image === node.imageUrl
  ) {
    delete node.imageUrl;
    changed = true;
  }

  for (const value of Object.values(node)) {
    changed = transformNode(value) || changed;
  }

  return changed;
};

const processJsonFile = async (filePath) => {
  const data = await fs.readFile(filePath, 'utf8');
  let json;
  try {
    json = JSON.parse(data);
  } catch (error) {
    console.warn(`Skipping invalid JSON file: ${filePath}`);
    return;
  }

  const changed = transformNode(json);
  if (changed) {
    await fs.writeFile(filePath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
    console.log(`Updated ${path.relative(rootDir, filePath)}`);
  }
};

const walkDirectory = async (dirPath) => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkDirectory(fullPath);
    } else if (entry.isFile() && isJsonFile(fullPath)) {
      await processJsonFile(fullPath);
    }
  }
};

const main = async () => {
  for (const dir of contentDirs) {
    try {
      await walkDirectory(dir);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  for (const file of additionalFiles) {
    try {
      await processJsonFile(file);
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }
};

main().catch((error) => {
  console.error('Failed to remove imageRef fields', error);
  process.exitCode = 1;
});
