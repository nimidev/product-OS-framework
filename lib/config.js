/**
 * Config file loader for Product OS Framework
 * Reads .prd.config.json from the workspace root
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILENAME = '.prd.config.json';

/**
 * Find the workspace root by walking up from cwd looking for .prd.config.json
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} Path to workspace root, or null
 */
function findWorkspaceRoot(startDir) {
  let dir = path.resolve(startDir || process.cwd());
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (fs.existsSync(path.join(dir, CONFIG_FILENAME))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Load config from workspace root
 * @param {string} workspacePath - Path to workspace (or auto-detect)
 * @returns {Object} Config object with defaults applied
 */
function loadConfig(workspacePath) {
  const root = workspacePath || findWorkspaceRoot(process.cwd());
  if (!root) {
    return null;
  }

  const configPath = path.join(root, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    config._root = root;
    config._configPath = configPath;
    return applyDefaults(config);
  } catch (err) {
    console.error(`Error reading ${CONFIG_FILENAME}:`, err.message);
    return null;
  }
}

/**
 * Save config to workspace root
 * @param {Object} config - Config object to save
 */
function saveConfig(config) {
  const configPath = config._configPath;
  if (!configPath) {
    throw new Error('Cannot save config: no _configPath set');
  }
  const toWrite = { ...config };
  delete toWrite._root;
  delete toWrite._configPath;
  fs.writeFileSync(configPath, JSON.stringify(toWrite, null, 2) + '\n', 'utf-8');
}

/**
 * Apply default values to config
 * @param {Object} config
 * @returns {Object}
 */
function applyDefaults(config) {
  return {
    name: config.name || 'Product Docs',
    nextId: config.nextId || 1,
    ignoreDirs: config.ignoreDirs || ['.git', 'node_modules', 'scripts', 'docs'],
    projects: config.projects || {},
    processVersion: config.processVersion || '2.0',
    ...config
  };
}

module.exports = {
  CONFIG_FILENAME,
  findWorkspaceRoot,
  loadConfig,
  saveConfig
};
