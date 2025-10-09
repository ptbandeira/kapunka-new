#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const logDirectory = resolve(repoRoot, 'logs', 'deploy-diagnostics');
mkdirSync(logDirectory, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFileName = `build-${timestamp}.log`;
const logFilePath = resolve(logDirectory, logFileName);
const logStream = createWriteStream(logFilePath, { encoding: 'utf8' });

const outputChunks = [];
const supportsColor = process.stdout.isTTY;
const colorize = (value, code) => (supportsColor ? `\u001b[${code}m${value}\u001b[0m` : value);
const bold = (value) => colorize(value, '1');
const red = (value) => colorize(value, '31');
const cyan = (value) => colorize(value, '36');

const build = spawn('npm', ['run', 'build'], {
  env: { ...process.env, FORCE_COLOR: '1' },
  shell: process.platform === 'win32',
});

const handleData = (chunk, stream) => {
  const text = chunk.toString();
  outputChunks.push(text);
  process[stream].write(text);
  logStream.write(text);
};

build.stdout.on('data', (chunk) => handleData(chunk, 'stdout'));
build.stderr.on('data', (chunk) => handleData(chunk, 'stderr'));

build.on('close', (code) => {
  logStream.end();
  const fullOutput = outputChunks.join('');
  const lines = fullOutput.split(/\r?\n/);

  if (code === 0) {
    console.log(`\n${colorize('Build completed successfully.', '32')} Full log saved to ${cyan(relativePath(logFilePath))}.`);
    return;
  }

  process.exitCode = code ?? 1;
  console.error(`\n${red('Build failed.')} Captured detailed diagnostics below:\n`);

  const summaries = summarize(lines);
  if (summaries.length === 0) {
    console.error('No structured error locations were detected. Review the log for details.');
  } else {
    for (const summary of summaries) {
      console.error(`${bold(summary.file)}`);
      for (const detail of summary.details) {
        const location = `  line ${detail.line}, column ${detail.column}`;
        const message = detail.message ? ` — ${detail.message}` : '';
        console.error(`${location}${message}`);
      }
      console.error('');
    }
  }

  console.error(`Full log saved to ${cyan(relativePath(logFilePath))}.`);
});

const fileLocationRegex = /(?<file>(?:[A-Za-z]:)?[^\s():]+?\.(?:[mc]?tsx?|jsx?|json|css|s[ac]ss|less|mdx?|html|ya?ml)):(?<line>\d+):(?<column>\d+)/;

function summarize(lines) {
  const summaries = new Map();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) continue;
    const match = fileLocationRegex.exec(line);
    if (!match?.groups) continue;

    const normalizedPath = normalizeFilePath(match.groups.file);
    const lineNumber = Number.parseInt(match.groups.line, 10);
    const columnNumber = Number.parseInt(match.groups.column, 10);
    const message = extractMessage(lines, index);

    if (!summaries.has(normalizedPath)) {
      summaries.set(normalizedPath, []);
    }

    const existing = summaries.get(normalizedPath);
    const isDuplicate = existing.some(
      (entry) => entry.line === lineNumber && entry.column === columnNumber && entry.message === message,
    );

    if (!isDuplicate) {
      existing.push({ line: lineNumber, column: columnNumber, message });
    }
  }

  return Array.from(summaries.entries())
    .map(([file, details]) => ({
      file,
      details: details.sort((a, b) => a.line - b.line || a.column - b.column),
    }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

function extractMessage(lines, startIndex) {
  for (let index = startIndex; index >= 0 && startIndex - index <= 5; index -= 1) {
    const candidate = lines[index]?.trim();
    if (!candidate) continue;
    if (/error/i.test(candidate) && !fileLocationRegex.test(candidate)) {
      return candidate;
    }
  }

  const fallback = lines[startIndex]?.trim();
  return fallback && !fileLocationRegex.test(fallback) ? fallback : undefined;
}

function normalizeFilePath(rawPath) {
  if (!rawPath) return 'unknown';
  let sanitized = rawPath.replace(/^file:\/\//, '').replace(/^["']|["']$/g, '');
  const hasDriveLetter = /^[A-Za-z]:/.test(sanitized);

  if (sanitized.startsWith('.')) {
    sanitized = resolve(repoRoot, sanitized);
  } else if (!hasDriveLetter && !sanitized.startsWith('/')) {
    sanitized = resolve(repoRoot, sanitized);
  }

  if (hasDriveLetter || sanitized.startsWith('/')) {
    sanitized = relative(repoRoot, sanitized);
  }

  return sanitized.replace(/^\.\//, '').replace(/\\/g, '/');
}

function relativePath(target) {
  const relativeTarget = relative(repoRoot, target);
  return relativeTarget.replace(/\\/g, '/');
}
