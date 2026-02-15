#!/usr/bin/env node

/**
 * Product OS Framework CLI
 * AI-native product development lifecycle for Cursor
 */

const { Command } = require('commander');
const path = require('path');
const { findWorkspaceRoot, loadConfig } = require('../lib/config');
const { dashboard } = require('../lib/commands/dashboard');

const program = new Command();

program
  .name('prd')
  .description('Product OS Framework - AI-native product development lifecycle for Cursor')
  .version('1.0.0');

// --- prd init ---
program
  .command('init')
  .description('Create a new product workspace')
  .action(async () => {
    const { init } = require('../lib/commands/init');
    await init();
  });

// --- prd add-project ---
program
  .command('add-project')
  .description('Add a new project to the workspace')
  .action(async () => {
    const { addProject } = require('../lib/commands/add-project');
    await addProject();
  });

// --- prd dashboard ---
program
  .command('dashboard')
  .description('Display product stories dashboard')
  .option('-p, --path <path>', 'Path to product-docs workspace')
  .option('-s, --status <status>', 'Filter by status (backlog, dev, done, etc.)')
  .option('--phase <phase>', 'Filter by phase (create, dev, release)')
  .option('-c, --compact', 'Compact output')
  .action((options) => {
    const docsPath = resolveDocsPath(options.path);
    dashboard(docsPath, options);
  });

// --- prd list ---
program
  .command('list')
  .description('List all stories (compact view)')
  .option('-p, --path <path>', 'Path to product-docs workspace')
  .action((options) => {
    const docsPath = resolveDocsPath(options.path);
    dashboard(docsPath, { ...options, compact: true });
  });

// --- prd stats ---
program
  .command('stats')
  .description('Show statistics summary')
  .option('-p, --path <path>', 'Path to product-docs workspace')
  .action((options) => {
    const chalk = require('chalk');
    const { scanAllStories, getStats } = require('../lib/parser');
    const { getTriageIssueCount } = require('../lib/github');

    const docsPath = resolveDocsPath(options.path);
    try {
      const data = scanAllStories(docsPath);
      const stats = getStats(data.stories);
      const triageCount = getTriageIssueCount(process.cwd());

      console.log('\n' + chalk.bold.cyan('📊 Statistics'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`Total:      ${chalk.green.bold(stats.total)}`);
      console.log(`Progress:   ${chalk.yellow.bold(stats.avgProgress + '%')}`);
      console.log(`Blocked:    ${stats.blocked > 0 ? chalk.red.bold(stats.blocked) : chalk.gray('0')}`);
      const triageDisplay = triageCount === null ? chalk.gray('N/A (gh?)') : chalk.cyan.bold(triageCount);
      console.log(`Triage:     ${triageDisplay}`);
      console.log('');
    } catch (err) {
      console.error(chalk.red('Error:'), err.message);
      process.exit(1);
    }
  });

// --- Default: show dashboard if no command given ---
if (process.argv.length === 2) {
  const docsPath = resolveDocsPath();
  if (docsPath) {
    dashboard(docsPath);
  } else {
    const chalk = require('chalk');
    console.log('\n' + chalk.bold.cyan('Product OS Framework'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.white('No product workspace found.\n'));
    console.log(chalk.white('Get started:'));
    console.log(chalk.cyan('  prd init') + chalk.gray('           Create a new workspace'));
    console.log(chalk.cyan('  prd dashboard') + chalk.gray('      View stories dashboard'));
    console.log(chalk.cyan('  prd --help') + chalk.gray('         See all commands\n'));
  }
} else {
  program.parse();
}

/**
 * Resolve the product-docs workspace path
 * Priority: explicit --path > auto-detect via config > cwd
 */
function resolveDocsPath(explicitPath) {
  if (explicitPath) return path.resolve(explicitPath);

  const root = findWorkspaceRoot(process.cwd());
  if (root) return root;

  // Fallback: current directory
  return process.cwd();
}
