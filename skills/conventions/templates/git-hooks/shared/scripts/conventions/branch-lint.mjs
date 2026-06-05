#!/usr/bin/env node

const args = process.argv.slice(2);
const localRefIndex = args.indexOf('--local-ref');
const localRef = localRefIndex >= 0 ? args[localRefIndex + 1] : '';
const branchName = (localRef || '').replace(/^refs\/heads\//, '');

const allowed = /^(feature|fix|hotfix|chore|refactor|docs)\/[A-Z]{2,10}-\d{1,6}-[a-z0-9-]+$/;

if (!branchName) {
  process.exit(0);
}

if (!allowed.test(branchName)) {
  console.error(`❌ Invalid branch name: ${branchName}`);
  console.error('Expected: type/TICKET-kebab-description');
  console.error('Example: feature/ENG-123-update-auth-flow');
  process.exit(1);
}
