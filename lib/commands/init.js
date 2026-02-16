/**
 * prd init - Interactive workspace scaffolding (TUI via @clack/prompts when kickoff enabled)
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { CONFIG_FILENAME } = require('../config');

const DEFAULT_STACK = 'Next.js + TS + Tailwind';
const DEFAULT_STACK_REASON = 'Optimized for AI-native development and speed.';

let clackPromise = null;
function getClack() {
  return (clackPromise ??= import('@clack/prompts'));
}

function printTUIHeader() {
  const line = '─'.repeat(38);
  console.log('\n' + chalk.cyan.bold('┌' + line + '┐'));
  console.log(chalk.cyan.bold('│') + ' Product OS Framework.' + ' '.repeat(14) + chalk.cyan.bold('│'));
  console.log(chalk.cyan.bold('│') + " Let's build something new." + ' '.repeat(10) + chalk.cyan.bold('│'));
  console.log(chalk.cyan.bold('└' + line + '┘\n'));
}

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
 * Run kickoff flow with Clack TUI: product context + technical preferences (US-002).
 * Returns kickoff data object or null if cancelled.
 */
async function runKickoffPrompts() {
  const p = await getClack();
  const { text, select, isCancel, cancel } = p;

  console.log(chalk.gray('  Be as descriptive as you want—this is the foundation for your PRD.\n'));
  const whatBuilding = await text({
    message: chalk.cyan('What are we building?'),
    placeholder: 'e.g. A dashboard for X, an API that does Y…',
    validate: (v) => (v && v.trim().length > 0 ? undefined : 'Say something short.'),
  });
  if (isCancel(whatBuilding)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const whoAudience = await text({
    message: chalk.cyan('Who is the target audience?'),
    placeholder: 'e.g. End users, internal team, developers',
  });
  if (isCancel(whoAudience)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  console.log(chalk.gray("  Think about the 'Why' and the value created.\n"));
  const goalsOutcomes = await text({
    message: chalk.cyan('What are the main goals/outcomes?'),
    placeholder: 'e.g. Ship a working product, validate demand…',
    validate: (v) => (v && v.trim().length > 0 ? undefined : 'At least one goal.'),
  });
  if (isCancel(goalsOutcomes)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const constraints = await text({
    message: chalk.cyan('Any constraints or special needs? (optional)'),
    placeholder: 'e.g. compliance, accessibility — or Enter to skip',
  });
  if (isCancel(constraints)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  const stackChoice = await select({
    message: chalk.cyan('Choose your technical foundation:'),
    options: [
      {
        value: 'suggest',
        label: 'Suggest Default',
        hint: `Framework Suggestion: ${DEFAULT_STACK}. Why: ${DEFAULT_STACK_REASON}`,
      },
      { value: 'manual', label: 'Enter Manually', hint: 'What tech stack would you like to use?' },
    ],
  });
  if (isCancel(stackChoice)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  let stackDescription = DEFAULT_STACK;
  let useDefaultStack = stackChoice === 'suggest';
  if (stackChoice === 'manual') {
    const custom = await text({
      message: chalk.cyan('What tech stack would you like to use?'),
      placeholder: 'e.g. Next.js, Python, FastAPI, Supabase',
      validate: (v) => (v && v.trim().length > 0 ? undefined : 'Enter at least one technology.'),
    });
    if (isCancel(custom)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    stackDescription = custom.trim();
    useDefaultStack = false;
  }

  return {
    product: {
      whatAchieving: String(whatBuilding).trim(),
      whoUsers: String(whoAudience).trim(),
      goals: String(goalsOutcomes).trim(),
      constraints: (constraints && String(constraints).trim()) || null,
    },
    tech: { stackDescription, useDefaultStack },
  };
}

/**
 * Show Strategic Summary box and confirm (or re-run). Returns approved kickoff data or null if aborted.
 */
async function confirmKickoffSummary(kickoffData) {
  const p = await getClack();
  const { confirm, select, isCancel, cancel } = p;

  function formatSummary(data) {
    const pr = data.product;
    const t = data.tech;
    return [
      chalk.bold('Product'),
      `  What we're building: ${pr.whatAchieving}`,
      `  Target audience: ${pr.whoUsers}`,
      `  Goals / outcomes: ${pr.goals}`,
      ...(pr.constraints ? [`  Constraints: ${pr.constraints}`] : []),
      '',
      chalk.bold('Technical'),
      `  Stack: ${t.stackDescription}`,
    ];
  }

  const stripAnsi = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '');
  const width = 54;
  const contentWidth = width - 4; // space for "│ " and " │"

  /** Wrap plain text to maxLen, break at spaces. Returns array of padded lines. */
  function wordWrapPlain(plain, maxLen) {
    if (plain.length <= maxLen) return [plain + ' '.repeat(Math.max(0, maxLen - plain.length))];
    const out = [];
    let rest = plain;
    const indent = (plain.match(/^\s*/) || [''])[0];
    while (rest.length > 0) {
      if (rest.length <= maxLen) {
        out.push(rest + ' '.repeat(maxLen - rest.length));
        break;
      }
      let split = maxLen;
      const segment = rest.slice(0, maxLen);
      const lastSpace = segment.lastIndexOf(' ');
      if (lastSpace > 20) split = lastSpace + 1;
      const line = rest.slice(0, split);
      out.push(line + ' '.repeat(maxLen - line.length));
      rest = indent + rest.slice(split).trimStart();
    }
    return out;
  }

  for (;;) {
    const rawLines = formatSummary(kickoffData);
    const allRows = [];
    for (const row of rawLines) {
      if (row === '') {
        allRows.push(' '.repeat(contentWidth));
        continue;
      }
      const plain = stripAnsi(row);
      if (plain.length <= contentWidth) {
        allRows.push(row + ' '.repeat(Math.max(0, contentWidth - plain.length)));
      } else {
        allRows.push(...wordWrapPlain(plain, contentWidth));
      }
    }
    const borderLine = '─'.repeat(width - 2);
    console.log('\n' + chalk.cyan.bold('┌' + borderLine + '┐'));
    console.log(chalk.cyan.bold('│') + ' Strategic Summary' + ' '.repeat(width - 21) + chalk.cyan.bold('│'));
    console.log(chalk.cyan.bold('├' + borderLine + '┤'));
    allRows.forEach((row) => {
      console.log(chalk.cyan.bold('│ ') + row + chalk.cyan.bold(' │'));
    });
    console.log(chalk.cyan.bold('└' + borderLine + '┘\n'));

    const approved = await confirm({
      message: chalk.cyan('Looks good? Proceed with setup.'),
      initialValue: true,
    });
    if (isCancel(approved)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    if (approved) return kickoffData;

    const action = await select({
      message: chalk.cyan('What would you like to do?'),
      options: [
        { value: 'rerun', label: 'Run kickoff again (answer questions again)' },
        { value: 'abort', label: 'Abort init' },
      ],
    });
    if (isCancel(action)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    if (action === 'abort') {
      console.log(chalk.yellow('\nInit aborted.\n'));
      return null;
    }
    kickoffData = await runKickoffPrompts();
  }
}

/**
 * Main init command
 */
async function init(options = {}) {
  let cwdAtStart;
  try {
    cwdAtStart = process.cwd();
  } catch (e) {
    console.error(chalk.red('Error: Current working directory no longer exists. Run from a valid folder.'));
    process.exit(1);
  }
  const templatesDir = path.join(__dirname, '..', '..', 'templates');
  const kickoffEnabled = options.kickoff !== false;

  let kickoffData = null;
  if (kickoffEnabled) {
    printTUIHeader();
    kickoffData = await runKickoffPrompts();
    kickoffData = await confirmKickoffSummary(kickoffData);
    if (kickoffData === null) return;
  } else {
    console.log('\n' + chalk.bold.cyan('Welcome to Product OS Framework!'));
    console.log(chalk.gray('Let\'s set up your product workspace.\n'));
  }

  let wsName, projName, projDesc, repoPath;
  if (kickoffEnabled) {
    const p = await getClack();
    const { text, confirm, isCancel, cancel } = p;
    const ws = await text({
      message: chalk.cyan('Workspace folder name'),
      placeholder: 'product-docs',
      initialValue: 'product-docs',
      validate: (v) => (v && v.trim().length > 0 ? undefined : 'Name is required'),
    });
    if (isCancel(ws)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    console.log(chalk.gray('  This folder will hold your product docs — backlogs, PRDs, RULES.\n'));
    wsName = String(ws).trim();

    const proj = await text({
      message: chalk.cyan('Initial project name'),
      placeholder: 'my-project',
      validate: (v) => {
        if (!v || !v.trim()) return 'Project name is required';
        if (/[^a-zA-Z0-9_-]/.test(v.trim())) return 'Use only letters, numbers, hyphens, underscores';
        return undefined;
      },
    });
    if (isCancel(proj)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    projName = String(proj).trim();

    const desc = await text({
      message: chalk.cyan('Project description (optional)'),
      placeholder: 'Short description of the product',
    });
    if (isCancel(desc)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    projDesc = desc ? String(desc).trim() : '';

    const hasRepo = await confirm({
      message: chalk.cyan('Do you have an existing dev repo for this project?'),
      initialValue: false,
    });
    if (isCancel(hasRepo)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    if (hasRepo) {
      const rp = await text({
        message: chalk.cyan('Path to the dev repo:'),
        validate: (v) => {
          if (!v || !v.trim()) return 'Path is required';
          const resolved = path.resolve(v.trim());
          if (!fs.existsSync(resolved)) return `Path not found: ${resolved}`;
          return undefined;
        },
      });
      if (isCancel(rp)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }
      repoPath = path.resolve(String(rp).trim());
    } else {
      repoPath = null;
    }
  } else {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'workspaceName',
        message: 'Workspace folder name (this folder will hold your product docs — backlogs, PRDs, RULES):',
        default: 'product-docs',
        validate: (v) => v.trim().length > 0 || 'Name is required',
      },
      {
        type: 'input',
        name: 'projectName',
        message: 'Your first project name:',
        validate: (v) => {
          if (!v.trim()) return 'Project name is required';
          if (/[^a-zA-Z0-9_-]/.test(v.trim())) return 'Use only letters, numbers, hyphens, underscores';
          return true;
        },
      },
      {
        type: 'input',
        name: 'projectDescription',
        message: 'Project description (optional):',
        default: '',
      },
      {
        type: 'confirm',
        name: 'hasRepo',
        message: 'Do you have an existing dev repo for this project?',
        default: false,
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
        },
      },
    ]);
    wsName = answers.workspaceName.trim();
    projName = answers.projectName.trim();
    projDesc = answers.projectDescription.trim();
    repoPath = answers.repoPath ? path.resolve(answers.repoPath) : null;
  }

  const targetDir = path.resolve(cwdAtStart, wsName);

  if (fs.existsSync(targetDir)) {
    if (kickoffEnabled) {
      const p = await getClack();
      const overwrite = await p.confirm({
        message: chalk.cyan(`Directory "${wsName}" already exists. Continue and add files?`),
        initialValue: true,
      });
      if (p.isCancel(overwrite)) {
        p.cancel('Operation cancelled.');
        process.exit(0);
      }
      if (!overwrite) {
        console.log(chalk.yellow('\nAborted.\n'));
        return;
      }
    } else {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `Directory "${wsName}" already exists. Continue and add files?`,
        default: true,
      }]);
      if (!overwrite) {
        console.log(chalk.yellow('\nAborted.\n'));
        return;
      }
    }
  }

  const createdFiles = [];
  const runFileCreation = () => {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(path.join(targetDir, projName), { recursive: true });
    const projects = {};
    projects[projName] = { description: projDesc, repoPath: repoPath || null };
    const config = {
      name: wsName,
      nextId: 1,
      ignoreDirs: ['.git', 'node_modules', 'scripts', 'docs'],
      projects,
      processVersion: '2.0',
    };
    fs.writeFileSync(path.join(targetDir, CONFIG_FILENAME), JSON.stringify(config, null, 2) + '\n', 'utf-8');
    createdFiles.push(`${wsName}/${CONFIG_FILENAME}`);
    const processTemplate = path.join(templatesDir, 'PROCESS.md');
    if (fs.existsSync(processTemplate)) {
      fs.copyFileSync(processTemplate, path.join(targetDir, 'PROCESS.md'));
    } else {
      fs.writeFileSync(path.join(targetDir, 'PROCESS.md'), '# Product Development Process v2.0\n\nSee the Product OS Framework documentation for the full process.\n', 'utf-8');
    }
    createdFiles.push(`${wsName}/PROCESS.md`);
    const readmeContent = renderTemplate(path.join(templatesDir, 'README.md.tmpl'), {
      workspaceName: wsName,
      projectName: projName,
      projectDescription: projDesc || 'No description yet',
      nextId: 'US-001',
    });
    fs.writeFileSync(path.join(targetDir, 'README.md'), readmeContent, 'utf-8');
    createdFiles.push(`${wsName}/README.md`);
    const backlogContent = renderTemplate(path.join(templatesDir, 'backlog.md.tmpl'), { projectName: projName });
    fs.writeFileSync(path.join(targetDir, projName, 'backlog.md'), backlogContent, 'utf-8');
    createdFiles.push(`${wsName}/${projName}/backlog.md`);
    if (kickoffData) {
      const p = kickoffData.product;
      const visionContent = [
        `# ${projName} – Vision & Context`,
        '',
        'This file captures the project vision and context from kickoff. AI agents and the team use it for consistent decisions.',
        '',
        "## What we're building",
        '',
        p.whatAchieving,
        '',
        "## Who it's for",
        '',
        p.whoUsers,
        '',
        '## Goals',
        '',
        p.goals,
        '',
        ...(p.constraints ? ['## Constraints / special needs', '', p.constraints, ''] : []),
      ].join('\n');
      fs.writeFileSync(path.join(targetDir, projName, 'VISION.md'), visionContent, 'utf-8');
      createdFiles.push(`${wsName}/${projName}/VISION.md`);
    }
    const techStackBlock = kickoffData
      ? `- **Stack (from kickoff):** ${kickoffData.tech.stackDescription}\n- Fill in versions and add Database/Testing as needed.`
      : '- Language:\n- Framework:\n- Database:\n- Testing:';
    const rulesContent = renderTemplate(path.join(templatesDir, 'RULES.md.tmpl'), { projectName: projName, techStack: techStackBlock });
    fs.writeFileSync(path.join(targetDir, projName, 'RULES.md'), rulesContent, 'utf-8');
    createdFiles.push(`${wsName}/${projName}/RULES.md`);
    const wsFilePath = createWorkspaceFile(targetDir, wsName, projects);
    createdFiles.push(path.basename(wsFilePath));
    fs.writeFileSync(path.join(targetDir, '.gitignore'), 'node_modules/\n.DS_Store\n', 'utf-8');
    return wsFilePath;
  };

  let wsFilePath;
  if (kickoffEnabled) {
    const p = await getClack();
    const s = p.spinner();
    s.start('Constructing Product Framework....');
    wsFilePath = runFileCreation();
    s.stop('Constructing Product Framework....');
    p.log.success('Created:');
    createdFiles.forEach((f) => p.log.success(`  ${f}`));
    p.outro(chalk.green('Your product workspace is ready.'));
  } else {
    console.log(chalk.gray('\nCreating workspace...\n'));
    wsFilePath = runFileCreation();
    console.log(chalk.green('  ✅ Created ') + chalk.white(createdFiles.join('\n  ✅ Created ')));
    console.log('\n' + chalk.bold.green('🎉 Done! Your product workspace is ready.\n'));
  }

  const wsFileAbsolute = path.resolve(wsFilePath);

  console.log(chalk.white.bold('Next steps:\n'));
  console.log(chalk.cyan('  1. Create your first story (in Cursor):'));
  console.log(chalk.white(`     Open the folder ${chalk.bold(wsName)} in Cursor, then in chat:`));
  console.log(chalk.white(`     /create "feature description" @${projName}/backlog.md\n`));
  console.log(chalk.cyan('  2. View dashboard (in terminal):'));
  console.log(chalk.white(`     cd ${wsName} && prd\n`));
  if (!repoPath) {
    console.log(chalk.gray('  ℹ️  No dev repo linked yet. When development starts, run:'));
    console.log(chalk.gray(`     prd add-project ${projName} --link /path/to/repo\n`));
  }
  console.log(chalk.gray('  💡 To open product docs and dev repo in one Cursor view later:'));
  console.log(chalk.gray(`     File → Open Workspace from File → ${wsFileAbsolute}\n`));
}

module.exports = { init };
