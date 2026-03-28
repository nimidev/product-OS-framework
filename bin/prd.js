#!/usr/bin/env node

/**
 * Product OS Framework CLI
 * AI-native product development lifecycle for Cursor
 */

const { Command } = require('commander');
const path = require('path');
const chalk = require('chalk');
const { findWorkspaceRoot, ConfigLoadError } = require('../lib/config');
const { dashboard } = require('../lib/commands/dashboard');

const program = new Command();

program
  .name('prd')
  .description('Product OS Framework - AI-native product development lifecycle for Cursor')
  .version('3.0.0');

function resolveDocsPath(explicitPath) {
  if (explicitPath) return path.resolve(explicitPath);
  const root = findWorkspaceRoot(process.cwd());
  return root || null;
}

function requireDocsPath(options) {
  const docsPath = resolveDocsPath(options.path);
  if (!docsPath) {
    console.error(chalk.red('No product workspace found.'));
    console.error(
      chalk.gray('Run ') + chalk.cyan('prd init') + chalk.gray(' from inside your project repo to create product-docs/.\n')
    );
    process.exit(1);
  }
  return docsPath;
}

function handleCommandError(err) {
  if (err instanceof ConfigLoadError) {
    console.error(chalk.red(`Invalid config ${err.configPath}:`), err.message);
    process.exit(1);
  }
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
}

// --- prd init ---
program
  .command('init')
  .description('Create product-docs/ inside the current project repo')
  .option('--no-kickoff', 'Skip project kickoff (vision & tech setup)')
  .option('-y, --yes', 'Non-interactive: defaults, no prompts (use with --no-kickoff in CI)')
  .action(async (options) => {
    const { init } = require('../lib/commands/init');
    try {
      await init({ kickoff: options.kickoff !== false, yes: options.yes });
    } catch (err) {
      handleCommandError(err);
    }
  });

// --- prd add-project ---
program
  .command('add-project')
  .description('Deprecated — use prd init in each project repo')
  .action(async () => {
    const { addProject } = require('../lib/commands/add-project');
    await addProject();
  });

// --- prd dashboard ---
program
  .command('dashboard')
  .description('Display product stories dashboard')
  .option('-p, --path <path>', 'Path to product-docs (docs root)')
  .option('-s, --status <status>', 'Filter by status (backlog, dev, done, etc.)')
  .option('--phase <phase>', 'Filter by phase (create, dev, release)')
  .option('-c, --compact', 'Compact output')
  .action((options) => {
    try {
      const docsPath = requireDocsPath(options);
      dashboard(docsPath, options);
    } catch (err) {
      handleCommandError(err);
    }
  });

// --- prd list ---
program
  .command('list')
  .description('List all stories (compact view)')
  .option('-p, --path <path>', 'Path to product-docs (docs root)')
  .action((options) => {
    try {
      const docsPath = requireDocsPath(options);
      dashboard(docsPath, { ...options, compact: true });
    } catch (err) {
      handleCommandError(err);
    }
  });

// --- prd stats ---
program
  .command('stats')
  .description('Show statistics summary')
  .option('-p, --path <path>', 'Path to product-docs (docs root)')
  .action((options) => {
    const { scanAllStories, getStats } = require('../lib/parser');
    const { getTriageIssueCount } = require('../lib/github');

    try {
      const docsPath = requireDocsPath(options);
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
      handleCommandError(err);
    }
  });

// --- Default: show dashboard if no command given ---
if (process.argv.length === 2) {
  const docsPath = resolveDocsPath();
  if (docsPath) {
    try {
      dashboard(docsPath);
    } catch (err) {
      handleCommandError(err);
    }
  } else {
    console.log('\n' + chalk.bold.cyan('Product OS Framework'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.white('No product workspace found.\n'));
    console.log(chalk.white('Get started:'));
    console.log(chalk.cyan('  prd init') + chalk.gray('           Create product-docs/ in this repo'));
    console.log(chalk.cyan('  prd dashboard') + chalk.gray('      View stories dashboard'));
    console.log(chalk.cyan('  prd --help') + chalk.gray('         See all commands'));
    console.log('');
    console.log(
      chalk.gray('Exit codes: ') +
        chalk.white('0') +
        chalk.gray(' success · ') +
        chalk.white('1') +
        chalk.gray(' error · ') +
        chalk.white('2') +
        chalk.gray(' init: already initialized\n')
    );
  }
} else {
  program.parse();
}
