#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.venv', 'dist', 'build', 'coverage', 'vendor']);
const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.sh']);

// Winnowing parameters. Higher k reduces noise; window controls fingerprint density.
const K_GRAM_SIZE = 6;
const WINDOW_SIZE = 5;
const MIN_CONTENT_LENGTH = 400;
const MIN_FINGERPRINT_OVERLAP = 18;
const CONTAINMENT_THRESHOLD = 0.86;
const JACCARD_THRESHOLD = 0.72;

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

function getStagedFiles() {
  const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], { encoding: 'utf8' });
  return output.split('\n').map((s) => s.trim()).filter(Boolean);
}

function getStagedFileContent(file) {
  try {
    return execFileSync('git', ['show', `:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function normalize(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/^\s*#.*$/gm, ' ')
    .replace(/(['"`])(?:\\.|(?!\1).)*\1/g, ' STR ')
    .replace(/\b\d+(?:\.\d+)?\b/g, ' NUM ')
    .toLowerCase();
}

function tokenize(text) {
  return normalize(text).match(/[a-z_][a-z0-9_]*|==|!=|<=|>=|=>|[-+*/%<>()[\]{}.,:;=]/g) || [];
}

function hashKGram(tokens, start, size) {
  const gram = tokens.slice(start, start + size).join(' ');
  const digest = crypto.createHash('sha1').update(gram).digest();
  return digest.readUInt32BE(0);
}

function buildHashes(tokens, size) {
  const hashes = [];
  for (let i = 0; i <= tokens.length - size; i += 1) {
    hashes.push({ index: i, hash: hashKGram(tokens, i, size) });
  }
  return hashes;
}

// MOSS-style winnowing: keeps a sparse fingerprint set that is more robust than raw Jaccard over all shingles.
function winnow(hashes, windowSize) {
  if (hashes.length === 0) return [];
  if (hashes.length <= windowSize) {
    return [hashes.reduce((min, item) => (item.hash <= min.hash ? item : min), hashes[0])];
  }

  const fingerprints = [];
  let lastPickedIndex = -1;

  for (let i = 0; i <= hashes.length - windowSize; i += 1) {
    let min = hashes[i];
    for (let j = i + 1; j < i + windowSize; j += 1) {
      if (hashes[j].hash <= min.hash) {
        min = hashes[j];
      }
    }

    if (min.index !== lastPickedIndex) {
      fingerprints.push(min);
      lastPickedIndex = min.index;
    }
  }

  return fingerprints;
}

function fingerprintSet(content) {
  const tokens = tokenize(content);
  if (tokens.length < K_GRAM_SIZE) return new Set();
  const hashes = buildHashes(tokens, K_GRAM_SIZE);
  const fingerprints = winnow(hashes, WINDOW_SIZE);
  return new Set(fingerprints.map((item) => String(item.hash)));
}

function overlapStats(a, b) {
  if (a.size === 0 || b.size === 0) {
    return { intersection: 0, containment: 0, jaccard: 0 };
  }

  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }

  const union = a.size + b.size - intersection;
  const containment = intersection / Math.min(a.size, b.size);
  const jaccard = union === 0 ? 0 : intersection / union;
  return { intersection, containment, jaccard };
}

const repoFiles = walk(ROOT).map((file) => ({
  rel: path.relative(ROOT, file),
  ext: path.extname(file),
  content: fs.readFileSync(file, 'utf8'),
}));

const offenders = [];
for (const stagedFile of getStagedFiles()) {
  const ext = path.extname(stagedFile);
  if (!CODE_EXTENSIONS.has(ext)) continue;

  const stagedContent = getStagedFileContent(stagedFile);
  if (!stagedContent || stagedContent.length < MIN_CONTENT_LENGTH) continue;

  const stagedFingerprints = fingerprintSet(stagedContent);
  if (stagedFingerprints.size === 0) continue;

  let best = {
    file: '',
    intersection: 0,
    containment: 0,
    jaccard: 0,
  };

  for (const candidate of repoFiles) {
    if (candidate.rel === stagedFile) continue;
    if (candidate.ext !== ext) continue;
    if (candidate.content.length < MIN_CONTENT_LENGTH) continue;

    const candidateFingerprints = fingerprintSet(candidate.content);
    const stats = overlapStats(stagedFingerprints, candidateFingerprints);

    if (
      stats.containment > best.containment ||
      (stats.containment === best.containment && stats.jaccard > best.jaccard)
    ) {
      best = {
        file: candidate.rel,
        intersection: stats.intersection,
        containment: stats.containment,
        jaccard: stats.jaccard,
      };
    }
  }

  if (
    best.intersection >= MIN_FINGERPRINT_OVERLAP &&
    (best.containment >= CONTAINMENT_THRESHOLD || best.jaccard >= JACCARD_THRESHOLD)
  ) {
    offenders.push({
      file: stagedFile,
      similarTo: best.file,
      overlap: best.intersection,
      containment: best.containment,
      jaccard: best.jaccard,
    });
  }
}

if (offenders.length > 0) {
  console.error('❌ Staged files are highly similar to existing repo files:');
  for (const offender of offenders) {
    console.error(
      `- ${offender.file} ~ ${offender.similarTo} ` +
      `(containment=${offender.containment.toFixed(2)}, jaccard=${offender.jaccard.toFixed(2)}, overlap=${offender.overlap})`,
    );
  }
  console.error('   Similarity uses token-based winnowing fingerprints, not raw Jaccard alone.');
  console.error('   Consider refactoring, extracting shared logic, or explicitly justifying the duplication.');
  process.exit(1);
}
