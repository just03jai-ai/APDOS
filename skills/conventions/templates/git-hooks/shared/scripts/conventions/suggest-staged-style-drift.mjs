#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(['.git', 'node_modules', '.venv', 'dist', 'build', 'coverage', 'vendor']);
const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.py', '.sh']);
const K_GRAM_SIZE = 6;
const WINDOW_SIZE = 5;
const MIN_CONTENT_LENGTH = 250;
const MIN_CONTAINMENT_FOR_REPORT = 0.45;
const MIN_PATH_PROXIMITY_FOR_HINT = 0.2;

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
      if (hashes[j].hash <= min.hash) min = hashes[j];
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

function directoryParts(relPath) {
  const dir = path.dirname(relPath);
  if (!dir || dir === '.') return [];
  return dir.split(path.sep).filter(Boolean);
}

function pathProximity(aRelPath, bRelPath) {
  const aParts = directoryParts(aRelPath);
  const bParts = directoryParts(bRelPath);

  if (aParts.length === 0 || bParts.length === 0) {
    return aParts.length === bParts.length ? 1 : 0;
  }

  let commonPrefix = 0;
  while (
    commonPrefix < aParts.length &&
    commonPrefix < bParts.length &&
    aParts[commonPrefix] === bParts[commonPrefix]
  ) {
    commonPrefix += 1;
  }

  if (commonPrefix === 0) return 0;

  const longest = Math.max(aParts.length, bParts.length);
  return commonPrefix / longest;
}

function sameParentDirectory(aRelPath, bRelPath) {
  return path.dirname(aRelPath) === path.dirname(bRelPath);
}

function rankCandidate(stagedFile, stats, candidateRel) {
  const proximity = pathProximity(stagedFile, candidateRel);
  const sameDirBonus = sameParentDirectory(stagedFile, candidateRel) ? 0.08 : 0;
  const score = (stats.containment * 0.75) + (stats.jaccard * 0.15) + (proximity * 0.10) + sameDirBonus;
  return { proximity, score };
}

function nonEmptyLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0);
}

function avgLineLength(text) {
  const lines = nonEmptyLines(text);
  if (lines.length === 0) return 0;
  const total = lines.reduce((sum, line) => sum + line.length, 0);
  return total / lines.length;
}

function quotePreference(text) {
  const single = (text.match(/'[^'\n]*'/g) || []).length;
  const double = (text.match(/"[^"\n]*"/g) || []).length;
  if (single === 0 && double === 0) return 'neutral';
  return single >= double ? 'single' : 'double';
}

function semicolonRatio(text) {
  const lines = nonEmptyLines(text).filter((line) => /[a-zA-Z0-9_)\]]\s*;\s*$/.test(line) || /[a-zA-Z0-9_)\]]\s*$/.test(line));
  if (lines.length === 0) return 0;
  const withSemi = lines.filter((line) => /;\s*$/.test(line)).length;
  return withSemi / lines.length;
}

function importRelativeRatio(text) {
  const imports = text.match(/^\s*import\s.+from\s+['"](.+)['"];?$/gm) || [];
  if (imports.length === 0) return 0;
  const relative = imports.filter((line) => /from\s+['"]\.?\.?\//.test(line)).length;
  return relative / imports.length;
}

function arrowVsFunction(text) {
  const arrow = (text.match(/=>/g) || []).length;
  const fnDecl = (text.match(/\bfunction\b/g) || []).length;
  return { arrow, fnDecl };
}

function pythonMetrics(text) {
  return {
    typeHints: (text.match(/def\s+\w+\s*\([^)]*\)\s*->/g) || []).length,
    prints: (text.match(/\bprint\s*\(/g) || []).length,
    loggingCalls: (text.match(/\blogging\.[a-z_]+\s*\(/g) || []).length,
    docstrings: (text.match(/"""[\s\S]*?"""|'''[\s\S]*?'''/g) || []).length,
  };
}

function jsMetrics(text) {
  const { arrow, fnDecl } = arrowVsFunction(text);
  return {
    semicolonRatio: semicolonRatio(text),
    quotePreference: quotePreference(text),
    importRelativeRatio: importRelativeRatio(text),
    arrow,
    fnDecl,
  };
}

function styleSummary(ext, content) {
  const common = { avgLineLength: avgLineLength(content) };
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    return { ...common, ...jsMetrics(content) };
  }
  if (ext === '.py') {
    return { ...common, ...pythonMetrics(content) };
  }
  return common;
}

function compareStyle(ext, a, b) {
  const notes = [];
  if (Math.abs(a.avgLineLength - b.avgLineLength) >= 20) {
    notes.push(`average line length differs (${a.avgLineLength.toFixed(1)} vs ${b.avgLineLength.toFixed(1)})`);
  }

  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) {
    if (a.quotePreference !== b.quotePreference && a.quotePreference !== 'neutral' && b.quotePreference !== 'neutral') {
      notes.push(`quote preference differs (${a.quotePreference} vs ${b.quotePreference})`);
    }
    if (Math.abs(a.semicolonRatio - b.semicolonRatio) >= 0.45) {
      notes.push(`semicolon style differs (${a.semicolonRatio.toFixed(2)} vs ${b.semicolonRatio.toFixed(2)})`);
    }
    if (Math.abs(a.importRelativeRatio - b.importRelativeRatio) >= 0.5) {
      notes.push(`import style differs (${a.importRelativeRatio.toFixed(2)} relative vs ${b.importRelativeRatio.toFixed(2)})`);
    }
    const aDominant = a.arrow > a.fnDecl ? 'arrow functions' : 'function declarations';
    const bDominant = b.arrow > b.fnDecl ? 'arrow functions' : 'function declarations';
    if (aDominant !== bDominant && (a.arrow + a.fnDecl) >= 3 && (b.arrow + b.fnDecl) >= 3) {
      notes.push(`function style differs (${aDominant} vs ${bDominant})`);
    }
  }

  if (ext === '.py') {
    if ((a.typeHints > 0) !== (b.typeHints > 0)) {
      notes.push(`type-hint style differs (${a.typeHints > 0 ? 'typed' : 'untyped'} vs ${b.typeHints > 0 ? 'typed' : 'untyped'})`);
    }
    if ((a.docstrings > 0) !== (b.docstrings > 0)) {
      notes.push(`docstring usage differs (${a.docstrings > 0 ? 'present' : 'absent'} vs ${b.docstrings > 0 ? 'present' : 'absent'})`);
    }
    if ((a.loggingCalls > 0) !== (b.loggingCalls > 0) || (a.prints > 0) !== (b.prints > 0)) {
      notes.push('logging/print style differs');
    }
  }

  return notes;
}

const repoFiles = walk(ROOT).map((file) => ({
  rel: path.relative(ROOT, file),
  ext: path.extname(file),
  content: fs.readFileSync(file, 'utf8'),
}));

let hadSuggestions = false;
for (const stagedFile of getStagedFiles()) {
  const ext = path.extname(stagedFile);
  if (!CODE_EXTENSIONS.has(ext)) continue;

  const stagedContent = getStagedFileContent(stagedFile);
  if (!stagedContent || stagedContent.length < MIN_CONTENT_LENGTH) continue;
  const stagedFingerprints = fingerprintSet(stagedContent);
  if (stagedFingerprints.size === 0) continue;

  let best = { file: '', containment: 0, jaccard: 0, pathProximity: 0, score: 0, content: '' };
  for (const candidate of repoFiles) {
    if (candidate.rel === stagedFile) continue;
    if (candidate.ext !== ext) continue;
    if (candidate.content.length < MIN_CONTENT_LENGTH) continue;

    const stats = overlapStats(stagedFingerprints, fingerprintSet(candidate.content));
    const ranking = rankCandidate(stagedFile, stats, candidate.rel);

    if (ranking.score > best.score) {
      best = {
        file: candidate.rel,
        containment: stats.containment,
        jaccard: stats.jaccard,
        pathProximity: ranking.proximity,
        score: ranking.score,
        content: candidate.content,
      };
    }
  }

  if (!best.file || best.containment < MIN_CONTAINMENT_FOR_REPORT || best.pathProximity < MIN_PATH_PROXIMITY_FOR_HINT) continue;

  const notes = compareStyle(ext, styleSummary(ext, stagedContent), styleSummary(ext, best.content));
  if (notes.length === 0) continue;

  hadSuggestions = true;
  console.log(`ℹ️  Style drift suggestion for ${stagedFile}`);
  console.log(
    `   Nearest reference: ${best.file} ` +
    `(containment=${best.containment.toFixed(2)}, jaccard=${best.jaccard.toFixed(2)}, pathProximity=${best.pathProximity.toFixed(2)})`,
  );
  for (const note of notes.slice(0, 4)) {
    console.log(`   - ${note}`);
  }
  console.log('   Reference selection prefers nearby files in the same directory subtree.');
  console.log('   Review whether aligning with the nearby file would make this easier to review.');
}

if (hadSuggestions) {
  console.log('\n✅ Style drift suggestions are non-blocking by design.');
}
