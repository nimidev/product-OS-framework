/**
 * Config file loader for Product OS Framework
 * Resolves docs root: v3 co-located product-docs/ or legacy workspace root
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILENAME = '.prd.config.json';
const PRODUCT_DOCS_DIR = 'product-docs';

class ConfigLoadError extends Error {
  constructor(configPath, message) {
    super(message);
    this.name = 'ConfigLoadError';
    this.configPath = configPath;
  }
}

/**
 * Nearest ancestor from startDir: child product-docs/.prd.config.json exists → docs root is that product-docs/
 */
function findPass1Root(startDir) {
  let dir = path.resolve(startDir || process.cwd());
  const root = path.parse(dir).root;

  while (dir !== root) {
    const nested = path.join(dir, PRODUCT_DOCS_DIR, CONFIG_FILENAME);
    if (fs.existsSync(nested)) {
      return path.join(dir, PRODUCT_DOCS_DIR);
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Legacy: ancestor directory contains .prd.config.json at that directory's root
 */
function findPass2Root(startDir) {
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
 * Docs root: directory that directly contains .prd.config.json
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null}
 */
function findWorkspaceRoot(startDir) {
  return findPass1Root(startDir) || findPass2Root(startDir);
}

/**
 * Load config from docs root (or auto-detect from cwd)
 * @param {string|null|undefined} workspacePath - Docs root path, or omit to auto-detect
 * @returns {Object|null} Config with _root and _configPath, or null if not found
 * @throws {ConfigLoadError} If config file exists but is invalid
 */
function loadConfig(workspacePath) {
  const root =
    workspacePath != null && workspacePath !== ''
      ? path.resolve(workspacePath)
      : findWorkspaceRoot(process.cwd());

  if (!root) {
    return null;
  }

  const configPath = path.join(root, CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) {
    return null;
  }

  let raw;
  try {
    raw = fs.readFileSync(configPath, 'utf-8');
  } catch (err) {
    throw new ConfigLoadError(configPath, `Cannot read config: ${err.message}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new ConfigLoadError(configPath, `Invalid JSON: ${err.message}`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new ConfigLoadError(configPath, 'Config must be a JSON object');
  }

  const config = parsed;
  config._root = root;
  config._configPath = configPath;
  return applyDefaults(config);
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
    processVersion: config.processVersion || '3.0',
    ...config,
  };
}

module.exports = {
  CONFIG_FILENAME,
  PRODUCT_DOCS_DIR,
  ConfigLoadError,
  findWorkspaceRoot,
  loadConfig,
  saveConfig
};
