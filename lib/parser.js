/**
 * Story Parser - Reusable core module
 * Parses US-*.md files with YAML frontmatter
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { loadConfig } = require('./config');

/**
 * Parse a single story file
 * @param {string} filePath - Path to US-*.md file
 * @returns {Object} Story metadata
 */
function parseStory(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data, content: body } = matter(content);

  // Extract title from first # heading
  const titleMatch = body.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Untitled';

  // Normalize progress to string format "X/Y"
  let progress = data.progress || '0/0';
  if (typeof progress === 'number') {
    progress = `${progress}/100`;
  } else if (typeof progress !== 'string') {
    progress = String(progress);
  }
  if (!progress.includes('/')) {
    progress = `${progress}/100`;
  }

  return {
    id: data.id || path.basename(filePath, '.md'),
    title,
    project: data.project || 'unknown',
    status: data.status || 'backlog',
    phase: data.phase || 'create',
    progress,
    priority: data.priority || 'P2',
    assignee: data.assignee || 'unassigned',
    blockers: Array.isArray(data.blockers) ? data.blockers : [],
    dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
    created: data.created || null,
    updated: data.updated || null,
    source_issue: data.source_issue != null ? (String(data.source_issue).startsWith('#') ? String(data.source_issue) : '#' + String(data.source_issue)) : null,
    filePath
  };
}

/**
 * Scan all stories in a product-docs workspace
 * @param {string} productDocsPath - Path to workspace root
 * @returns {Object} { projects: [], stories: [], lastUpdated: Date }
 */
function scanAllStories(productDocsPath) {
  if (!fs.existsSync(productDocsPath)) {
    throw new Error(`Path does not exist: ${productDocsPath}`);
  }

  // Load config for ignore list, or use defaults
  const config = loadConfig(productDocsPath);
  const ignoreDirs = config
    ? config.ignoreDirs
    : ['.git', 'node_modules', 'scripts', 'cli', 'docs'];

  const stories = [];
  const projects = {};

  const entries = fs.readdirSync(productDocsPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectName = entry.name;

    // Skip ignored directories
    if (projectName.startsWith('.') || ignoreDirs.includes(projectName)) {
      continue;
    }

    const projectPath = path.join(productDocsPath, projectName);
    const files = fs.readdirSync(projectPath);
    const storyFiles = files.filter(f => /^US-\d+\.md$/.test(f));

    if (storyFiles.length === 0) continue;

    projects[projectName] = {
      name: projectName,
      path: projectPath,
      storyCount: storyFiles.length,
      stories: []
    };

    for (const file of storyFiles) {
      try {
        const story = parseStory(path.join(projectPath, file));
        stories.push(story);
        projects[projectName].stories.push(story);
      } catch (err) {
        // Silently skip unparseable files in production
      }
    }
  }

  return {
    projects: Object.values(projects),
    stories,
    lastUpdated: new Date()
  };
}

/**
 * Get summary statistics
 * @param {Array} stories
 * @returns {Object}
 */
function getStats(stories) {
  const stats = {
    total: stories.length,
    byStatus: {},
    byPhase: {},
    byPriority: {},
    blocked: 0,
    avgProgress: 0
  };

  let totalProgress = 0;

  for (const story of stories) {
    stats.byStatus[story.status] = (stats.byStatus[story.status] || 0) + 1;
    stats.byPhase[story.phase] = (stats.byPhase[story.phase] || 0) + 1;
    stats.byPriority[story.priority] = (stats.byPriority[story.priority] || 0) + 1;

    if (story.blockers && story.blockers.length > 0) {
      stats.blocked++;
    }

    const [completed, total] = story.progress.split('/').map(Number);
    if (total > 0) {
      totalProgress += (completed / total) * 100;
    }
  }

  stats.avgProgress = stories.length > 0 ? Math.round(totalProgress / stories.length) : 0;
  return stats;
}

module.exports = {
  parseStory,
  scanAllStories,
  getStats
};
