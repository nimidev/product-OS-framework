/**
 * prd add-project - Add a new project to the workspace
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { loadConfig, saveConfig, CONFIG_FILENAME } = require('../config');

/**
 * Update .code-workspace file to include new project's dev repo
 */
function updateWorkspaceFile(workspaceRoot, projects) {
  // Find .code-workspace files in parent directory
  const parentDir = path.dirname(workspaceRoot);
  const wsFiles = fs.readdirSync(parentDir).filter(f => f.endsWith('.code-workspace'));

  for (const wsFile of wsFiles) {
    const wsPath = path.join(parentDir, wsFile);
    try {
      const ws = JSON.parse(fs.readFileSync(wsPath, 'utf-8'));

      // Add any new project repos that aren't already in the workspace
      for (const [name, proj] of Object.entries(projects)) {
        if (!proj.repoPath) continue;
        const relPath = path.relative(parentDir, proj.repoPath);
        const alreadyIncluded = ws.folders.some(f => f.path === relPath || f.name === name);
        if (!alreadyIncluded) {
          ws.folders.push({ name, path: relPath });
        }
      }

      fs.writeFileSync(wsPath, JSON.stringify(ws, null, 2) + '\n', 'utf-8');
      return wsPath;
    } catch (err) {
      // Skip malformed workspace files
    }
  }
  return null;
}

/**
 * Main add-project command
 */
async function addProject(options = {}) {
  const config = loadConfig();
  if (!config) {
    console.log(chalk.red('\nNo Product OS workspace found.'));
    console.log(chalk.gray(`Run ${chalk.cyan('prd init')} to create one.\n`));
    return;
  }

  const workspaceRoot = config._root;
  const templatesDir = path.join(__dirname, '..', '..', 'templates');

  console.log(chalk.gray('\nAdding a new project to your workspace.\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: (v) => {
        if (!v.trim()) return 'Project name is required';
        if (/[^a-zA-Z0-9_-]/.test(v.trim())) return 'Use only letters, numbers, hyphens, underscores';
        if (config.projects[v.trim()]) return 'Project already exists';
        return true;
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description (optional):',
      default: ''
    },
    {
      type: 'confirm',
      name: 'hasRepo',
      message: 'Do you have an existing dev repo for this project?',
      default: false
    },
    {
      type: 'input',
      name: 'repoPath',
      message: 'Path to the dev repo:',
      when: (a) => a.hasRepo,
      validate: (v) => {
        const resolved = path.resolve(v);
        if (!fs.existsSync(resolved)) return `Path not found: ${resolved}`;
        return true;
      }
    }
  ]);

  const projName = answers.projectName.trim();
  const projDesc = answers.description.trim();
  const repoPath = answers.repoPath ? path.resolve(answers.repoPath) : null;

  // Create project directory
  const projDir = path.join(workspaceRoot, projName);
  fs.mkdirSync(projDir, { recursive: true });

  // Create backlog
  const backlogTmpl = path.join(templatesDir, 'backlog.md.tmpl');
  if (fs.existsSync(backlogTmpl)) {
    let content = fs.readFileSync(backlogTmpl, 'utf-8');
    content = content.replace(/\{\{projectName\}\}/g, projName);
    fs.writeFileSync(path.join(projDir, 'backlog.md'), content, 'utf-8');
  } else {
    fs.writeFileSync(path.join(projDir, 'backlog.md'),
      `# ${projName} - Backlog\n\n| ID | Title | Status | Priority |\n|----|-------|--------|----------|\n`, 'utf-8');
  }
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${projName}/backlog.md`));

  // Create context/ folder with PROJECT_CONTEXT, TECH_CONTEXT, and README
  const contextDir = path.join(projDir, 'context');
  fs.mkdirSync(contextDir, { recursive: true });

  const defaultTechStack = '- Language:\n- Framework:\n- Database:\n- Testing:';
  const defaultPlaceholder = '{To be filled}';

  const techTmpl = path.join(templatesDir, 'TECH_CONTEXT.md.tmpl');
  if (fs.existsSync(techTmpl)) {
    let content = fs.readFileSync(techTmpl, 'utf-8');
    content = content.replace(/\{\{projectName\}\}/g, projName);
    content = content.replace(/\{\{techStack\}\}/g, defaultTechStack);
    fs.writeFileSync(path.join(contextDir, 'TECH_CONTEXT.md'), content, 'utf-8');
  } else {
    fs.writeFileSync(path.join(contextDir, 'TECH_CONTEXT.md'),
      `# ${projName} — Technical Context\n\nDocument your project's tech stack, patterns, and conventions here.\n`, 'utf-8');
  }
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${projName}/context/TECH_CONTEXT.md`));

  const projCtxTmpl = path.join(templatesDir, 'PROJECT_CONTEXT.md.tmpl');
  if (fs.existsSync(projCtxTmpl)) {
    let content = fs.readFileSync(projCtxTmpl, 'utf-8');
    content = content.replace(/\{\{projectName\}\}/g, projName);
    content = content.replace(/\{\{productDescription\}\}/g, projDesc || defaultPlaceholder);
    content = content.replace(/\{\{targetUsers\}\}/g, defaultPlaceholder);
    content = content.replace(/\{\{goals\}\}/g, defaultPlaceholder);
    content = content.replace(/\{\{constraints\}\}/g, '{None identified yet}');
    content = content.replace(/\{\{commonNonGoals\}\}/g, defaultPlaceholder);
    fs.writeFileSync(path.join(contextDir, 'PROJECT_CONTEXT.md'), content, 'utf-8');
  } else {
    fs.writeFileSync(path.join(contextDir, 'PROJECT_CONTEXT.md'),
      `# Project Context: ${projName}\n\nUpdate this file with your product context.\n`, 'utf-8');
  }
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${projName}/context/PROJECT_CONTEXT.md`));

  const ctxReadmeTmpl = path.join(templatesDir, 'context-README.md.tmpl');
  if (fs.existsSync(ctxReadmeTmpl)) {
    let content = fs.readFileSync(ctxReadmeTmpl, 'utf-8');
    content = content.replace(/\{\{projectName\}\}/g, projName);
    fs.writeFileSync(path.join(contextDir, 'README.md'), content, 'utf-8');
  } else {
    fs.writeFileSync(path.join(contextDir, 'README.md'),
      `# Context\n\nShared context for the ${projName} project.\n`, 'utf-8');
  }
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${projName}/context/README.md`));

  // Update config
  config.projects[projName] = {
    description: projDesc,
    repoPath
  };
  saveConfig(config);
  console.log(chalk.green('  ✅ Updated ') + chalk.white(CONFIG_FILENAME));

  // Update README project table
  const readmePath = path.join(workspaceRoot, 'README.md');
  if (fs.existsSync(readmePath)) {
    let readme = fs.readFileSync(readmePath, 'utf-8');
    const tableRow = `| [${projName}](./${projName}/) | ${projDesc || ''} |`;
    // Insert before the empty line after the last table row
    readme = readme.replace(
      /(## Projects\n\n\|[^\n]+\n\|[^\n]+\n)([\s\S]*?)(\n\n)/,
      (match, header, rows, gap) => `${header}${rows}\n${tableRow}${gap}`
    );
    fs.writeFileSync(readmePath, readme, 'utf-8');
    console.log(chalk.green('  ✅ Updated ') + chalk.white('README.md'));
  }

  // Update workspace file
  if (repoPath) {
    const wsFile = updateWorkspaceFile(workspaceRoot, config.projects);
    if (wsFile) {
      console.log(chalk.green('  ✅ Updated ') + chalk.white(path.basename(wsFile)));
    }
  }

  console.log('\n' + chalk.bold.green(`🎉 Project "${projName}" added!\n`));
  console.log(chalk.white('Create stories in Cursor:'));
  console.log(chalk.cyan(`  /create "feature" @${projName}/backlog.md\n`));
}

module.exports = { addProject };
