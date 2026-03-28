/**
 * Story Parser - Reusable core module
 * Parses US-*.md files with YAML frontmatter
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { loadConfig, ConfigLoadError } = require('./config');

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
 * True if any US-*.md file lives directly in R (flat / v3 layout)
 * @param {string} docsRoot
 * @returns {boolean}
 */
function hasFlatStoriesAtRoot(docsRoot) {
  const entries = fs.readdirSync(docsRoot, { withFileTypes: true });
  return entries.some((e) => e.isFile() && /^US-\d+\.md$/.test(e.name));
}

/**
 * Scan legacy multi-project layout: immediate subdirs of R (except ignored) contain US-*.md
 */
function scanLegacySubprojects(docsRoot, ignoreDirs, projectsOut, storiesOut) {
  const entries = fs.readdirSync(docsRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const projectName = entry.name;
    if (projectName.startsWith('.') || ignoreDirs.includes(projectName)) {
      continue;
    }

    const projectPath = path.join(docsRoot, projectName);
    const files = fs.readdirSync(projectPath);
    const storyFiles = files.filter((f) => /^US-\d+\.md$/.test(f));

    if (storyFiles.length === 0) continue;

    const proj = {
      name: projectName,
      path: projectPath,
      storyCount: storyFiles.length,
      stories: []
    };
    projectsOut[projectName] = proj;

    for (const file of storyFiles) {
      try {
        const story = parseStory(path.join(projectPath, file));
        storiesOut.push(story);
        proj.stories.push(story);
      } catch (_err) {
        // skip unparseable
      }
    }
  }
}

/**
 * Scan flat layout: US-*.md only in docs root R
 */
function scanFlatProject(docsRoot, projectLabel, projectsOut, storiesOut) {
  const files = fs.readdirSync(docsRoot);
  const storyFiles = files.filter((f) => /^US-\d+\.md$/.test(f));
  if (storyFiles.length === 0) {
    return;
  }

  const proj = {
    name: projectLabel,
    path: docsRoot,
    storyCount: storyFiles.length,
    stories: []
  };
  projectsOut[projectLabel] = proj;

  for (const file of storyFiles) {
    try {
      const story = parseStory(path.join(docsRoot, file));
      storiesOut.push(story);
      proj.stories.push(story);
    } catch (_err) {
      // skip unparseable
    }
  }
}

/**
 * Scan all stories in a product-docs workspace (docs root R)
 * @param {string} productDocsPath - Path to docs root (folder containing .prd.config.json)
 * @returns {Object} { projects: [], stories: [], lastUpdated: Date }
 */
function scanAllStories(productDocsPath) {
  if (!fs.existsSync(productDocsPath)) {
    throw new Error(`Path does not exist: ${productDocsPath}`);
  }

  let config;
  try {
    config = loadConfig(productDocsPath);
  } catch (err) {
    if (err instanceof ConfigLoadError) {
      throw err;
    }
    throw err;
  }

  const ignoreDirs = config
    ? config.ignoreDirs
    : ['.git', 'node_modules', 'scripts', 'cli', 'docs'];

  const stories = [];
  const projects = {};
  const R = productDocsPath;

  if (hasFlatStoriesAtRoot(R)) {
    const projectLabel = config && config.name ? config.name : 'Product';
    scanFlatProject(R, projectLabel, projects, stories);
  } else {
    scanLegacySubprojects(R, ignoreDirs, projects, stories);
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
  getStats,
  hasFlatStoriesAtRoot
};
