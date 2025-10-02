import fs from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('No files provided');
  process.exit(1);
}

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const transformed = transform(text);
  if (transformed.changed) {
    fs.writeFileSync(file, transformed.text);
  }
}

function transform(text) {
  const target = 'data-nlv-field-path={';
  let index = 0;
  let result = '';
  let changed = false;

  while (index < text.length) {
    const found = text.indexOf(target, index);
    if (found === -1) {
      result += text.slice(index);
      break;
    }

    result += text.slice(index, found);
    const start = found + target.length;
    const { expression, endIndex } = extractExpression(text, start);
    result += `{...getVisualEditorAttributes(${expression})}`;
    index = endIndex;
    changed = true;
  }

  return { text: result, changed };
}

function extractExpression(text, start) {
  let i = start;
  let depth = 1;
  let escape = false;
  const states = ['default'];
  let expression = '';

  while (i < text.length) {
    const ch = text[i];
    expression += ch;

    if (escape) {
      escape = false;
      i += 1;
      continue;
    }

    const state = states[states.length - 1];

    if (state === 'single') {
      if (ch === '\\') {
        escape = true;
      } else if (ch === "'") {
        states.pop();
      }
      i += 1;
      continue;
    }

    if (state === 'double') {
      if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        states.pop();
      }
      i += 1;
      continue;
    }

    if (state === 'template') {
      if (ch === '\\') {
        escape = true;
        i += 1;
        continue;
      }

      if (ch === '`') {
        states.pop();
        i += 1;
        continue;
      }

      if (ch === '$' && text[i + 1] === '{') {
        const returnDepth = depth;
        depth += 1;
        states.push({ type: 'template-expression', returnDepth });
        expression += '{';
        i += 2;
        continue;
      }

      i += 1;
      continue;
    }

    if (state && typeof state === 'object' && state.type === 'template-expression') {
      if (ch === '\\') {
        escape = true;
        i += 1;
        continue;
      }

      if (ch === "'") {
        states.push('single');
        i += 1;
        continue;
      }

      if (ch === '"') {
        states.push('double');
        i += 1;
        continue;
      }

      if (ch === '`') {
        states.push('template');
        i += 1;
        continue;
      }

      if (ch === '{') {
        depth += 1;
        i += 1;
        continue;
      }

      if (ch === '}') {
        depth -= 1;
        if (depth === state.returnDepth) {
          states.pop();
          i += 1;
          continue;
        }
        if (depth === 0) {
          expression = expression.slice(0, -1);
          return { expression, endIndex: i + 1 };
        }
        i += 1;
        continue;
      }

      i += 1;
      continue;
    }

    if (state === 'default') {
      if (ch === '\\') {
        escape = true;
        i += 1;
        continue;
      }
      if (ch === "'") {
        states.push('single');
        i += 1;
        continue;
      }
      if (ch === '"') {
        states.push('double');
        i += 1;
        continue;
      }
      if (ch === '`') {
        states.push('template');
        i += 1;
        continue;
      }
      if (ch === '{') {
        depth += 1;
        i += 1;
        continue;
      }
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          expression = expression.slice(0, -1);
          return { expression, endIndex: i + 1 };
        }
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  throw new Error('Unterminated data-nlv-field-path expression');
}
