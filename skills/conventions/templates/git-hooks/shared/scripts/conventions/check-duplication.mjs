#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.venv', 'dist', 'build', 'coverage', 'vendor']);
const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.sh']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (!CODE_EXTENSIONS.has(path.extname(entry.name))) continue;
    out.push(fullPath);
  }
  return out;
}

function normalize(content, ext) {
  let text = content;
  text = text.replace(/\/\*[\s\S]*?\*\//g, '');
  text = text.replace(/^\s*\/\/.*$/gm, '');
  if (ext === '.py' || ext === '.sh') {
    text = text.replace(/^\s*#.*$/gm, '');
  }
  text = text.replace(/\s+/g, '');
  return text;
}

const byHash = new Map();
for (const file of walk(ROOT)) {
  const ext = path.extname(file);
  const content = fs.readFileSync(file, 'utf8');
  const normalized = normalize(content, ext);
  if (normalized.length < 200) continue;
  const hash = crypto.createHash('sha1').update(ext + ':' + normalized).digest('hex');
  const rel = path.relative(ROOT, file);
  const bucket = byHash.get(hash) || [];
  bucket.push(rel);
  byHash.set(hash, bucket);
}

const duplicates = [...byHash.values()].filter((group) => group.length > 1);
if (duplicates.length > 0) {
  console.error('❌ Potential duplicate files detected:');
  for (const group of duplicates) {
    console.error(`- ${group.join('  <->  ')}`);
  }
  process.exit(1);
}
