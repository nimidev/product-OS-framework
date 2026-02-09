/**
 * prd init - Interactive workspace scaffolding
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { CONFIG_FILENAME } = require('../config');

/**
 * Read a template file and replace {{placeholders}}
 */
function renderTemplate(templatePath, vars) {
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return content;
}

/**
 * Create a .code-workspace file
 */
function createWorkspaceFile(workspacePath, workspaceName, projects) {
  const folders = [
    { name: 'product-docs', path: path.basename(workspacePath) }
  ];

  for (const [name, proj] of Object.entries(projects)) {
    if (proj.repoPath) {
      const relPath = path.relative(path.dirname(workspacePath), proj.repoPath);
      folders.push({ name, path: relPath });
    }
  }

  const workspace = {
    folders,
    settings: {}
  };

  const wsFilePath = path.join(
    path.dirname(workspacePath),
    `${workspaceName.replace(/\s+/g, '-').toLowerCase()}.code-workspace`
  );

  fs.writeFileSync(wsFilePath, JSON.stringify(workspace, null, 2) + '\n', 'utf-8');
  return wsFilePath;
}

/**
 * Main init command
 */
async function init(options = {}) {
  const templatesDir = path.join(__dirname, '..', '..', 'templates');

  console.log('\n' + chalk.bold.cyan('Welcome to Product OS Framework!'));
  console.log(chalk.gray('Let\'s set up your product workspace.\n'));

  // --- Prompts ---
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'workspaceName',
      message: 'Workspace name:',
      default: 'product-docs',
      validate: (v) => v.trim().length > 0 || 'Name is required'
    },
    {
      type: 'input',
      name: 'projectName',
      message: 'Your first project name:',
      validate: (v) => {
        if (!v.trim()) return 'Project name is required';
        if (/[^a-zA-Z0-9_-]/.test(v.trim())) return 'Use only letters, numbers, hyphens, underscores';
        return true;
      }
    },
    {
      type: 'input',
      name: 'projectDescription',
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

  const wsName = answers.workspaceName.trim();
  const projName = answers.projectName.trim();
  const projDesc = answers.projectDescription.trim();
  const repoPath = answers.repoPath ? path.resolve(answers.repoPath) : null;

  // --- Determine target directory ---
  const targetDir = path.resolve(process.cwd(), wsName);

  if (fs.existsSync(targetDir)) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `Directory "${wsName}" already exists. Continue and add files?`,
      default: false
    }]);
    if (!overwrite) {
      console.log(chalk.yellow('\nAborted.\n'));
      return;
    }
  }

  console.log(chalk.gray('\nCreating workspace...\n'));

  // --- Create directories ---
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, projName), { recursive: true });

  // --- Create config ---
  const projects = {};
  projects[projName] = {
    description: projDesc,
    repoPath: repoPath || null
  };

  const config = {
    name: wsName,
    nextId: 1,
    ignoreDirs: ['.git', 'node_modules', 'scripts', 'docs'],
    projects,
    processVersion: '2.0'
  };

  fs.writeFileSync(
    path.join(targetDir, CONFIG_FILENAME),
    JSON.stringify(config, null, 2) + '\n',
    'utf-8'
  );
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${wsName}/${CONFIG_FILENAME}`));

  // --- Copy PROCESS.md ---
  const processTemplate = path.join(templatesDir, 'PROCESS.md');
  if (fs.existsSync(processTemplate)) {
    fs.copyFileSync(processTemplate, path.join(targetDir, 'PROCESS.md'));
  } else {
    // Fallback: minimal PROCESS.md
    fs.writeFileSync(path.join(targetDir, 'PROCESS.md'),
      '# Product Development Process v2.0\n\nSee the Product OS Framework documentation for the full process.\n', 'utf-8');
  }
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${wsName}/PROCESS.md`));

  // --- Create README.md ---
  const readmeContent = renderTemplate(path.join(templatesDir, 'README.md.tmpl'), {
    workspaceName: wsName,
    projectName: projName,
    projectDescription: projDesc || 'No description yet',
    nextId: 'US-001'
  });
  fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf-8');
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${wsName}/README.md`));

  // --- Create project backlog ---
  const backlogContent = renderTemplate(path.join(templatesDir, 'backlog.md.tmpl'), {
    projectName: projName
  });
  fs.writeFileSync(path.join(targetDir, projName, 'backlog.md'), backlogContent, 'utf-8');
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${wsName}/${projName}/backlog.md`));

  // --- Create project RULES.md ---
  const rulesContent = renderTemplate(path.join(templatesDir, 'RULES.md.tmpl'), {
    projectName: projName
  });
  fs.writeFileSync(path.join(targetDir, projName, 'RULES.md'), rulesContent, 'utf-8');
  console.log(chalk.green('  ✅ Created ') + chalk.white(`${wsName}/${projName}/RULES.md`));

  // --- Create .code-workspace file ---
  const wsFilePath = createWorkspaceFile(targetDir, wsName, projects);
  console.log(chalk.green('  ✅ Created ') + chalk.white(path.basename(wsFilePath)));

  // --- Create .gitignore ---
  fs.writeFileSync(path.join(targetDir, '.gitignore'), 'node_modules/\n.DS_Store\n', 'utf-8');

  // --- Done! ---
  console.log('\n' + chalk.bold.green('🎉 Done! Your product workspace is ready.\n'));

  console.log(chalk.white.bold('Next steps:\n'));

  console.log(chalk.cyan('  1. Open in Cursor:'));
  console.log(chalk.white(`     cursor ${path.relative(process.cwd(), wsFilePath)}\n`));

  console.log(chalk.cyan('  2. Create your first story (in Cursor):'));
  console.log(chalk.white(`     /create "feature description" @${projName}/backlog.md\n`));

  console.log(chalk.cyan('  3. View dashboard (in terminal):'));
  console.log(chalk.white(`     cd ${wsName} && prd\n`));

  if (!repoPath) {
    console.log(chalk.gray('  ℹ️  No dev repo linked yet. When ready, run:'));
    console.log(chalk.gray(`     prd add-project ${projName} --link /path/to/repo\n`));
  }
}

module.exports = { init };
