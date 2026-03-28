/**
 * Dashboard command - Rich terminal output
 */

const chalk = require('chalk');
const { ConfigLoadError } = require('../config');
const { scanAllStories, getStats } = require('../parser');
const { getTriageIssueCount } = require('../github');

const STATUS_CONFIG = {
  backlog: { icon: '📋', color: 'gray', label: 'Backlog' },
  create: { icon: '✏️', color: 'blue', label: 'Creating' },
  approved: { icon: '✅', color: 'green', label: 'Approved' },
  dev: { icon: '🔨', color: 'yellow', label: 'In Dev' },
  in_progress: { icon: '🔄', color: 'yellow', label: 'In Progress' },
  testing: { icon: '🧪', color: 'cyan', label: 'Testing' },
  review: { icon: '👀', color: 'magenta', label: 'Review' },
  release: { icon: '🚀', color: 'green', label: 'Release' },
  done: { icon: '✅', color: 'green', label: 'Done' },
  blocked: { icon: '🚫', color: 'red', label: 'Blocked' }
};

const PRIORITY_COLORS = {
  P0: 'red',
  P1: 'yellow',
  P2: 'blue',
  P3: 'gray'
};

function formatProgressBar(progress) {
  const [completed, total] = progress.split('/').map(Number);
  if (total === 0) return chalk.gray('N/A');

  const percentage = Math.round((completed / total) * 100);
  const barLength = 12;
  const filledLength = Math.round((completed / total) * barLength);
  const emptyLength = barLength - filledLength;

  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);

  let color = 'red';
  if (percentage >= 80) color = 'green';
  else if (percentage >= 50) color = 'yellow';

  return chalk[color](filled) + chalk.gray(empty) + chalk.white(` ${percentage}%`);
}

function formatStatus(status) {
  const config = STATUS_CONFIG[status] || { icon: '❓', color: 'gray', label: status };
  return config.icon + ' ' + chalk[config.color](config.label);
}

function formatPriority(priority) {
  const color = PRIORITY_COLORS[priority] || 'gray';
  return chalk[color].bold(priority);
}

function displaySummary(stats, triageCount = null) {
  console.log('\n' + chalk.bold.cyan('━'.repeat(60)));
  console.log(chalk.bold.cyan('  📊 PRODUCT STORIES DASHBOARD'));
  console.log(chalk.bold.cyan('━'.repeat(60)) + '\n');

  console.log(chalk.white.bold('Summary:'));
  console.log(`  Total Stories:     ${chalk.green.bold(stats.total)}`);
  console.log(`  Average Progress:  ${chalk.yellow.bold(stats.avgProgress + '%')}`);
  console.log(`  Blocked:           ${stats.blocked > 0 ? chalk.red.bold(stats.blocked) : chalk.gray('0')}`);
  const triageDisplay = triageCount === null ? chalk.gray('N/A (gh?)') : chalk.cyan.bold(triageCount);
  console.log(`  Issues (triage):   ${triageDisplay}`);

  console.log('\n' + chalk.white.bold('By Status:'));
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    const config = STATUS_CONFIG[status] || { icon: '❓', color: 'gray' };
    console.log(`  ${config.icon}  ${chalk[config.color](status.padEnd(12))} ${count}`);
  });

  console.log('\n' + chalk.white.bold('By Priority:'));
  Object.entries(stats.byPriority).forEach(([priority, count]) => {
    console.log(`  ${formatPriority(priority)}  ${count}`);
  });

  console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
}

function displayProjects(projects, options = {}) {
  for (const project of projects) {
    console.log(chalk.bold.white(`\n${project.name}`) + chalk.gray(` (${project.storyCount} stories)`));
    console.log(chalk.gray('─'.repeat(60)));

    const stories = project.stories.sort((a, b) => a.id.localeCompare(b.id));

    let filtered = stories;
    if (options.status) {
      filtered = filtered.filter(s => s.status === options.status);
    }
    if (options.phase) {
      filtered = filtered.filter(s => s.phase === options.phase);
    }

    if (filtered.length === 0) {
      console.log(chalk.gray('  No stories match filters\n'));
      continue;
    }

    for (const story of filtered) {
      const statusDisplay = formatStatus(story.status);
      const priorityDisplay = formatPriority(story.priority);
      const progressBar = formatProgressBar(story.progress);
      const blockerIndicator = story.blockers.length > 0 ? chalk.red.bold(' 🚫') : '';

      console.log(`  ${chalk.cyan.bold(story.id)}  ${statusDisplay}  ${priorityDisplay}${blockerIndicator}`);
      console.log(`    ${chalk.white(story.title)}`);
      console.log(`    ${progressBar}  ${chalk.gray(story.progress + ' AC')}`);

      if (story.blockers.length > 0) {
        console.log(`    ${chalk.red('Blocked by:')} ${story.blockers.join(', ')}`);
      }

      console.log('');
    }
  }
}

function displayCompact(projects) {
  for (const project of projects) {
    console.log(chalk.bold.white(`\n${project.name}`));

    const stories = project.stories.sort((a, b) => a.id.localeCompare(b.id));

    for (const story of stories) {
      const config = STATUS_CONFIG[story.status] || { icon: '❓' };
      const [completed, total] = story.progress.split('/').map(Number);
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      const blockerIndicator = story.blockers.length > 0 ? chalk.red(' 🚫') : '';

      console.log(`  ${config.icon} ${chalk.cyan(story.id)} ${chalk.gray(story.title)} ${chalk.yellow(percentage + '%')}${blockerIndicator}`);
    }
  }
  console.log('');
}

/**
 * Main dashboard command
 * @param {string} docsPath - Path to product-docs workspace
 * @param {Object} options
 */
function dashboard(docsPath, options = {}) {
  try {
    const data = scanAllStories(docsPath);
    const stats = getStats(data.stories);
    const triageCount = getTriageIssueCount(process.cwd());

    if (data.stories.length === 0) {
      console.log(chalk.yellow('\nNo stories found in ' + docsPath));
      console.log(chalk.gray('Create your first story in Cursor: /create "feature" @product-docs/backlog.md\n'));
      if (triageCount !== null) {
        console.log(chalk.white('Issues (triage): ') + chalk.cyan.bold(triageCount) + '\n');
      }
      return;
    }

    if (!options.compact) {
      displaySummary(stats, triageCount);
    }

    if (options.compact) {
      displayCompact(data.projects);
    } else {
      displayProjects(data.projects, options);
    }

    console.log(chalk.gray(`Last updated: ${data.lastUpdated.toLocaleString()}`));
    console.log('');

  } catch (err) {
    if (err instanceof ConfigLoadError) {
      console.error(chalk.red(`Invalid config ${err.configPath}:`), err.message);
      process.exit(1);
    }
    console.error(chalk.red('Error:'), err.message);
    process.exit(1);
  }
}

module.exports = { dashboard };
