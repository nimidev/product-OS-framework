#!/usr/bin/env node
/**
 * US-005: .cursor/rules/product-os.mdc scaffold, MDC shape, no clobber
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const { CONFIG_FILENAME } = require('../lib/config');

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failures++;
  }
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'prd-us005-'));
}

function testInitCreatesMdc() {
  const prdBin = path.join(__dirname, '..', 'bin', 'prd.js');
  const env = {
    ...process.env,
    CI: 'true',
    PRD_FRAMEWORK_PATH: '../nonexistent-framework-placeholder',
  };
  const empty = tmpdir();
  fs.writeFileSync(path.join(empty, 'package.json'), '{}');
  execSync(`node "${prdBin}" init --no-kickoff --yes`, {
    cwd: empty,
    env,
    stdio: 'pipe',
  });
  const mdc = path.join(empty, '.cursor', 'rules', 'product-os.mdc');
  assert(fs.existsSync(mdc), 'T1: init creates .cursor/rules/product-os.mdc');
  const raw = fs.readFileSync(mdc, 'utf-8');
  assert(raw.startsWith('---\n'), 'T1: MDC has opening frontmatter');
  assert(/description:\s/.test(raw), 'T1: frontmatter has description');
  assert(/globs:\s*\n\s*-\s*"/.test(raw) || /globs:\s*\n\s*-\s*\*\*/.test(raw), 'T1: frontmatter has globs');
  assert(raw.includes('---\n\n') || raw.includes('---\r\n\r\n'), 'T1: frontmatter closes');
}

function testMdcReferencesContextFiles() {
  const prdBin = path.join(__dirname, '..', 'bin', 'prd.js');
  const env = {
    ...process.env,
    CI: 'true',
    PRD_FRAMEWORK_PATH: '../nonexistent-framework-placeholder',
  };
  const empty = tmpdir();
  fs.writeFileSync(path.join(empty, 'package.json'), '{}');
  execSync(`node "${prdBin}" init --no-kickoff --yes`, {
    cwd: empty,
    env,
    stdio: 'pipe',
  });
  const mdc = path.join(empty, '.cursor', 'rules', 'product-os.mdc');
  const raw = fs.readFileSync(mdc, 'utf-8');
  assert(
    raw.includes('product-docs/context/PROJECT_CONTEXT.md'),
    'T2: MDC references PROJECT_CONTEXT'
  );
  assert(raw.includes('product-docs/context/TECH_CONTEXT.md'), 'T2: MDC references TECH_CONTEXT');
}

function testInitDoesNotOverwriteExistingMdc() {
  const prdBin = path.join(__dirname, '..', 'bin', 'prd.js');
  const env = {
    ...process.env,
    CI: 'true',
    PRD_FRAMEWORK_PATH: '../nonexistent-framework-placeholder',
  };
  const empty = tmpdir();
  fs.writeFileSync(path.join(empty, 'package.json'), '{}');
  const rulesDir = path.join(empty, '.cursor', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });
  const marker = 'PRESERVE_US005_EXISTING_MDC\n';
  fs.writeFileSync(path.join(rulesDir, 'product-os.mdc'), marker, 'utf-8');

  execSync(`node "${prdBin}" init --no-kickoff --yes`, {
    cwd: empty,
    env,
    stdio: 'pipe',
  });
  const raw = fs.readFileSync(path.join(rulesDir, 'product-os.mdc'), 'utf-8');
  assert(raw === marker, 'T3: existing product-os.mdc not overwritten');
  assert(fs.existsSync(path.join(empty, 'product-docs', CONFIG_FILENAME)), 'T3: init still created product-docs');
}

console.log('\n─── US-005 tests ───\n');
testInitCreatesMdc();
testMdcReferencesContextFiles();
testInitDoesNotOverwriteExistingMdc();

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.\n`);
  process.exit(1);
}
console.log('All US-005 tests passed.\n');
