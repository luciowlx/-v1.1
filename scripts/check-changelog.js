#!/usr/bin/env node
/**
 * Pre-commit check for CHANGELOG.md updates.
 * If there are staged code changes (src/, styles/, vite.config.ts, package.json),
 * require that CHANGELOG.md is also staged and contains a header for today's date.
 */
const { execSync } = require('child_process');
const fs = require('fs');

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    return [];
  }
}

const staged = getStagedFiles();
const requiresChangelog = staged.some((f) => (
  /^src\//.test(f) || /^styles\//.test(f) || f === 'vite.config.ts' || f === 'package.json'
));

if (!requiresChangelog) {
  process.exit(0);
}

const hasChangelog = staged.includes('CHANGELOG.md');
if (!hasChangelog) {
  console.error('[CHANGELOG CHECK] 检测到代码改动，但本次提交未包含 CHANGELOG.md 更新。\n请更新 CHANGELOG.md 并将其加入暂存区后重试。');
  process.exit(1);
}

const content = fs.readFileSync('CHANGELOG.md', 'utf8');
const now = new Date();
const yyyy = now.getFullYear();
const mm = String(now.getMonth() + 1).padStart(2, '0');
const dd = String(now.getDate()).padStart(2, '0');
const todayHeader = `### ${yyyy}-${mm}-${dd}`;

if (!content.includes(todayHeader)) {
  console.error(`[CHANGELOG CHECK] 已暂存 CHANGELOG.md，但未检测到当天日期段：${todayHeader}。\n请在“变更历史”中添加今日记录并重试。`);
  process.exit(1);
}

process.exit(0);