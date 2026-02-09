#!/usr/bin/env node
/**
 * End-to-end test: Simulates "Sarah" - a new PM setting up the framework.
 * Run from a clean directory to test the full flow.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const TEST_DIR = '/tmp/sarah-test';
const WORKSPACE_NAME = 'food-delivery-docs';
const PROJECT_NAME = 'delivery-api';

// Import framework modules directly
const { CONFIG_FILENAME, loadConfig, saveConfig } = require('../lib/config');
const { scanAllStories, getStats } = require('../lib/parser');
const { dashboard } = require('../lib/commands/dashboard');

function assert(condition, message) {
  if (!condition) {
    console.log(chalk.red(`  ❌ FAIL: ${message}`));
    process.exit(1);
  }
  console.log(chalk.green(`  ✅ ${message}`));
}

function header(text) {
  console.log('\n' + chalk.bold.cyan(`─── ${text} ───`));
}

// --- Setup ---
console.log(chalk.bold.white('\n🧪 Sarah Test: End-to-End Framework Test\n'));

// Clean up
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

// Create fake dev repo
const devRepoPath = path.join(TEST_DIR, 'delivery-api');
fs.mkdirSync(path.join(devRepoPath, 'src'), { recursive: true });
fs.writeFileSync(path.join(devRepoPath, 'package.json'), '{"name":"delivery-api"}');
fs.writeFileSync(path.join(devRepoPath, 'src', 'index.js'), '// app entry');

// --- Step 1: Simulate prd init ---
header('Step 1: prd init');

const templatesDir = path.join(__dirname, '..', 'templates');
const wsDir = path.join(TEST_DIR, WORKSPACE_NAME);

// Create workspace directory
fs.mkdirSync(wsDir, { recursive: true });
fs.mkdirSync(path.join(wsDir, PROJECT_NAME), { recursive: true });

// Create config
const config = {
  name: WORKSPACE_NAME,
  nextId: 1,
  ignoreDirs: ['.git', 'node_modules', 'scripts', 'docs'],
  projects: {
    [PROJECT_NAME]: {
      description: 'Backend API for food delivery platform',
      repoPath: devRepoPath
    }
  },
  processVersion: '2.0'
};
fs.writeFileSync(path.join(wsDir, CONFIG_FILENAME), JSON.stringify(config, null, 2) + '\n');
assert(fs.existsSync(path.join(wsDir, CONFIG_FILENAME)), 'Config created');

// Copy PROCESS.md
fs.copyFileSync(
  path.join(templatesDir, 'PROCESS.md'),
  path.join(wsDir, 'PROCESS.md')
);
assert(fs.existsSync(path.join(wsDir, 'PROCESS.md')), 'PROCESS.md created');

// Create README from template
let readme = fs.readFileSync(path.join(templatesDir, 'README.md.tmpl'), 'utf-8');
readme = readme.replace(/\{\{workspaceName\}\}/g, WORKSPACE_NAME);
readme = readme.replace(/\{\{projectName\}\}/g, PROJECT_NAME);
readme = readme.replace(/\{\{projectDescription\}\}/g, 'Backend API for food delivery platform');
readme = readme.replace(/\{\{nextId\}\}/g, 'US-001');
fs.writeFileSync(path.join(wsDir, 'README.md'), readme);
assert(fs.existsSync(path.join(wsDir, 'README.md')), 'README.md created');

// Create backlog from template
let backlog = fs.readFileSync(path.join(templatesDir, 'backlog.md.tmpl'), 'utf-8');
backlog = backlog.replace(/\{\{projectName\}\}/g, PROJECT_NAME);
fs.writeFileSync(path.join(wsDir, PROJECT_NAME, 'backlog.md'), backlog);
assert(fs.existsSync(path.join(wsDir, PROJECT_NAME, 'backlog.md')), 'backlog.md created');

// Create RULES.md from template
let rules = fs.readFileSync(path.join(templatesDir, 'RULES.md.tmpl'), 'utf-8');
rules = rules.replace(/\{\{projectName\}\}/g, PROJECT_NAME);
fs.writeFileSync(path.join(wsDir, PROJECT_NAME, 'RULES.md'), rules);
assert(fs.existsSync(path.join(wsDir, PROJECT_NAME, 'RULES.md')), 'RULES.md created');

// Create .code-workspace file
const workspace = {
  folders: [
    { name: 'product-docs', path: WORKSPACE_NAME },
    { name: PROJECT_NAME, path: PROJECT_NAME }
  ],
  settings: {}
};
const wsFilePath = path.join(TEST_DIR, `${WORKSPACE_NAME}.code-workspace`);
fs.writeFileSync(wsFilePath, JSON.stringify(workspace, null, 2) + '\n');
assert(fs.existsSync(wsFilePath), '.code-workspace file created');

// --- Step 2: Simulate creating stories (what /create would do in Cursor) ---
header('Step 2: Create stories (simulating /create in Cursor)');

function createStory(id, title, priority, status) {
  const story = `---
id: US-${String(id).padStart(3, '0')}
project: ${PROJECT_NAME}
status: ${status}
phase: ${status === 'done' ? 'deployed' : status === 'dev' ? 'development' : 'planning'}
progress: ${status === 'done' ? '100' : status === 'dev' ? '50' : '0'}
priority: ${priority}
created: 2026-02-09
updated: 2026-02-09
---

# US-${String(id).padStart(3, '0')}: ${title}

## Goal
${title} for the food delivery platform.

## Acceptance Criteria
1. Feature works as expected
2. Tests pass
3. Documentation updated
`;
  fs.writeFileSync(path.join(wsDir, PROJECT_NAME, `US-${String(id).padStart(3, '0')}.md`), story);
}

createStory(1, 'Real-time order tracking', 'P0', 'done');
createStory(2, 'Restaurant menu management', 'P1', 'dev');
createStory(3, 'Payment processing with Stripe', 'P0', 'create');
createStory(4, 'Push notifications for order updates', 'P1', 'backlog');

assert(fs.existsSync(path.join(wsDir, PROJECT_NAME, 'US-001.md')), 'US-001.md created');
assert(fs.existsSync(path.join(wsDir, PROJECT_NAME, 'US-004.md')), 'US-004.md created');

// --- Step 3: Test dashboard ---
header('Step 3: prd dashboard');

const data = scanAllStories(wsDir);
assert(data.stories.length === 4, `Found ${data.stories.length} stories (expected 4)`);
assert(data.projects.length === 1, `Found ${data.projects.length} project(s) (expected 1)`);
assert(data.projects[0].name === PROJECT_NAME, `Project name: ${data.projects[0].name}`);

const stats = getStats(data.stories);
assert(stats.total === 4, `Total stories: ${stats.total}`);
assert(stats.byStatus.done === 1, `Done: ${stats.byStatus.done}`);
assert(stats.byStatus.dev === 1, `Dev: ${stats.byStatus.dev}`);
assert(stats.byStatus.create === 1, `Create: ${stats.byStatus.create}`);
assert(stats.byStatus.backlog === 1, `Backlog: ${stats.byStatus.backlog}`);
assert(stats.avgProgress === 38, `Avg progress: ${stats.avgProgress}% (expected 38%)`);

// Display the actual dashboard
console.log('');
dashboard(wsDir);

// --- Step 4: Simulate add-project ---
header('Step 4: Add second project');

const proj2 = 'customer-app';
fs.mkdirSync(path.join(wsDir, proj2), { recursive: true });

let backlog2 = fs.readFileSync(path.join(templatesDir, 'backlog.md.tmpl'), 'utf-8');
backlog2 = backlog2.replace(/\{\{projectName\}\}/g, proj2);
fs.writeFileSync(path.join(wsDir, proj2, 'backlog.md'), backlog2);

let rules2 = fs.readFileSync(path.join(templatesDir, 'RULES.md.tmpl'), 'utf-8');
rules2 = rules2.replace(/\{\{projectName\}\}/g, proj2);
fs.writeFileSync(path.join(wsDir, proj2, 'RULES.md'), rules2);

createStoryInProject(5, 'Order placement flow', 'P0', 'create', proj2);

function createStoryInProject(id, title, priority, status, project) {
  const story = `---
id: US-${String(id).padStart(3, '0')}
project: ${project}
status: ${status}
phase: planning
progress: 0
priority: ${priority}
created: 2026-02-09
---

# US-${String(id).padStart(3, '0')}: ${title}

## Goal
${title}.

## Acceptance Criteria
1. Feature works as expected
`;
  fs.writeFileSync(path.join(wsDir, project, `US-${String(id).padStart(3, '0')}.md`), story);
}

assert(fs.existsSync(path.join(wsDir, proj2, 'US-005.md')), 'customer-app/US-005.md created');

// --- Step 5: Multi-project dashboard ---
header('Step 5: Multi-project dashboard');

const data2 = scanAllStories(wsDir);
assert(data2.stories.length === 5, `Found ${data2.stories.length} stories across all projects`);
assert(data2.projects.length === 2, `Found ${data2.projects.length} projects`);

console.log('');
dashboard(wsDir);

// --- Step 6: Config auto-detection ---
header('Step 6: Config auto-detection');

const loadedConfig = loadConfig(wsDir);
assert(loadedConfig !== null, 'Config loaded from workspace');
assert(loadedConfig.name === WORKSPACE_NAME, `Workspace name: ${loadedConfig.name}`);
assert(loadedConfig.projects[PROJECT_NAME] !== undefined, `Project "${PROJECT_NAME}" in config`);

// --- Summary ---
header('TEST RESULTS');
console.log(chalk.bold.green('\n  ✅ ALL TESTS PASSED!\n'));
console.log(chalk.white('  Sarah\'s workspace:'));
console.log(chalk.gray(`    ${wsDir}/`));
console.log(chalk.gray(`    ├── .prd.config.json`));
console.log(chalk.gray(`    ├── PROCESS.md`));
console.log(chalk.gray(`    ├── README.md`));
console.log(chalk.gray(`    ├── delivery-api/ (4 stories)`));
console.log(chalk.gray(`    └── customer-app/ (1 story)\n`));
console.log(chalk.gray(`    Workspace: ${wsFilePath}\n`));
