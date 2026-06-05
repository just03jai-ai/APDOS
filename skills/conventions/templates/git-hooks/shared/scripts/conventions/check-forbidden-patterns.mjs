#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const PATTERNS = [
  {
    regex: /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0/g,
    message: 'Disabling TLS verification is forbidden.',
  },
  {
    regex: /rejectUnauthorized\s*:\s*false/g,
    message: 'rejectUnauthorized: false is forbidden.',
  },
  {
    regex: /verify\s*=\s*False/g,
    message: 'verify=False style HTTP calls are forbidden.',
  },
  {
    regex: /shell\s*=\s*True/g,
    message: 'shell=True requires explicit security review.',
  },
];

const textExtensions = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.py', '.sh', '.yml', '.yaml', '.toml', '.md',
]);

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

const offenders = [];
for (const file of getStagedFiles()) {
  if (!textExtensions.has(path.extname(file))) continue;
  const content = getStagedFileContent(file);
  if (!content) continue;

  for (const rule of PATTERNS) {
    if (rule.regex.test(content)) {
      offenders.push({ file, message: rule.message });
      rule.regex.lastIndex = 0;
    }
  }
}

if (offenders.length > 0) {
  console.error('❌ Forbidden security pattern(s) detected in staged files:');
  for (const offender of offenders) {
    console.error(`- ${offender.file}: ${offender.message}`);
  }
  process.exit(1);
}
