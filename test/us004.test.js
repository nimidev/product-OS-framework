#!/usr/bin/env node
/**
 * US-004: v3 docs root, parser flat/legacy, config errors, init CLI
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const {
  findWorkspaceRoot,
  loadConfig,
  ConfigLoadError,
  CONFIG_FILENAME
} = require('../lib/config');
const { scanAllStories } = require('../lib/parser');

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failures++;
  }
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'prd-us004-'));
}

function testFindNestedProductDocs() {
  const base = tmpdir();
  const pd = path.join(base, 'product-docs');
  fs.mkdirSync(pd, { recursive: true });
  fs.writeFileSync(
    path.join(pd, CONFIG_FILENAME),
    JSON.stringify({ name: 'app', nextId: 1, projects: {} }, null, 2)
  );
  const nested = path.join(base, 'src', 'deep');
  fs.mkdirSync(nested, { recursive: true });
  const r1 = findWorkspaceRoot(nested);
  const r2 = findWorkspaceRoot(base);
  assert(r1 && path.resolve(r1) === path.resolve(pd), 'T1: nested cwd resolves product-docs');
  assert(r2 && path.resolve(r2) === path.resolve(pd), 'T1: repo root resolves same product-docs');
}

function testLegacyScan() {
  const leg = tmpdir();
  fs.writeFileSync(
    path.join(leg, CONFIG_FILENAME),
    JSON.stringify({ name: 'ws', nextId: 1, projects: {} }, null, 2)
  );
  fs.mkdirSync(path.join(leg, 'framework'), { recursive: true });
  fs.writeFileSync(
    path.join(leg, 'framework', 'US-001.md'),
    '---\nid: US-001\nproject: framework\n---\n\n# Story\n'
  );
  const d = scanAllStories(leg);
  assert(d.stories.length === 1 && d.stories[0].id === 'US-001', 'T2: legacy subdir scan');
}

function testFlatIgnoresSubdirUs() {
  const flat = tmpdir();
  fs.writeFileSync(
    path.join(flat, CONFIG_FILENAME),
    JSON.stringify({ name: 'solo', nextId: 1 }, null, 2)
  );
  fs.writeFileSync(
    path.join(flat, 'US-001.md'),
    '---\nid: US-001\nproject: solo\n---\n\n# A\n'
  );
  fs.mkdirSync(path.join(flat, 'nested'), { recursive: true });
  fs.writeFileSync(
    path.join(flat, 'nested', 'US-002.md'),
    '---\nid: US-002\n---\n\n# B\n'
  );
  const d = scanAllStories(flat);
  assert(d.stories.length === 1 && d.stories[0].id === 'US-001', 'T3: flat root only');
}

function testInvalidConfigThrows() {
  const bad = tmpdir();
  fs.writeFileSync(path.join(bad, CONFIG_FILENAME), '{ not json');
  let ok = false;
  try {
    loadConfig(bad);
  } catch (e) {
    ok = e instanceof ConfigLoadError && e.configPath.includes(CONFIG_FILENAME);
  }
  assert(ok, 'T6: invalid JSON throws ConfigLoadError');
}

function testInitCli() {
  const prdBin = path.join(__dirname, '..', 'bin', 'prd.js');
  const env = {
    ...process.env,
    CI: 'true',
    PRD_FRAMEWORK_PATH: '../nonexistent-framework-placeholder'
  };

  const empty = tmpdir();
  fs.writeFileSync(path.join(empty, 'package.json'), '{}');
  execSync(`node "${prdBin}" init --no-kickoff --yes`, {
    cwd: empty,
    env,
    stdio: 'pipe'
  });
  assert(fs.existsSync(path.join(empty, 'product-docs', CONFIG_FILENAME)), 'T4: init creates config');
  assert(fs.existsSync(path.join(empty, 'product-docs', 'backlog.md')), 'T4: init creates backlog');

  let code2 = 0;
  try {
    execSync(`node "${prdBin}" init --no-kickoff --yes`, {
      cwd: empty,
      env,
      stdio: 'pipe'
    });
  } catch (e) {
    code2 = e.status;
  }
  assert(code2 === 2, 'T7: second init exits 2');
}

console.log('\n─── US-004 tests ───\n');
testFindNestedProductDocs();
testLegacyScan();
testFlatIgnoresSubdirUs();
testInvalidConfigThrows();
testInitCli();

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.\n`);
  process.exit(1);
}
console.log('All US-004 tests passed.\n');
