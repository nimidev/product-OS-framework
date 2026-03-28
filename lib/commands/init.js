/**
 * prd init — Scaffold product-docs/ inside the current project repo (v3)
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

function renderTemplate(templatePath, vars) {
  let content = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(vars)) {
    content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return content;
}

/**
 * @param {string} projectRoot - Repo root (cwd)
 * @param {string} displayName - Project / workspace display name
 * @param {string} frameworkAbsolutePath - Absolute path to product-OS-framework
 */
function createWorkspaceFile(projectRoot, displayName, frameworkAbsolutePath) {
  const relFramework = path.relative(projectRoot, path.resolve(frameworkAbsolutePath));
  const workspace = {
    folders: [
      { name: displayName, path: '.' },
      { name: 'product-OS-framework', path: relFramework }
    ],
    settings: {}
  };
  const safeName = displayName.replace(/\s+/g, '-').toLowerCase();
  const wsFilePath = path.join(projectRoot, `${safeName}.code-workspace`);
  fs.writeFileSync(wsFilePath, JSON.stringify(workspace, null, 2) + '\n', 'utf-8');
  return wsFilePath;
}

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
  }

  return {
    product: {
      whatAchieving: String(whatBuilding).trim(),
      whoUsers: String(whoAudience).trim(),
      goals: String(goalsOutcomes).trim(),
      constraints: (constraints && String(constraints).trim()) || null,
    },
    tech: { stackDescription },
  };
}

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
  const contentWidth = width - 4;

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

function writeIfMissing(baseDir, relPath, content, createdFiles) {
  const full = path.join(baseDir, relPath);
  if (fs.existsSync(full)) return;
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, 'utf-8');
  createdFiles.push(`product-docs/${relPath.replace(/\\/g, '/')}`);
}

async function init(options = {}) {
  let cwdAtStart;
  try {
    cwdAtStart = process.cwd();
  } catch (_e) {
    console.error(chalk.red('Error: Current working directory no longer exists. Run from a valid folder.'));
    process.exit(1);
  }

  const templatesDir = path.join(__dirname, '..', '..', 'templates');
  const nonInteractive = Boolean(options.yes) || !process.stdin.isTTY || process.env.CI === 'true';
  const targetDir = path.join(cwdAtStart, 'product-docs');
  const configPath = path.join(targetDir, CONFIG_FILENAME);

  if (fs.existsSync(configPath)) {
    console.error(chalk.red('Product docs already initialized (product-docs/.prd.config.json exists).'));
    console.error(chalk.gray('Remove product-docs/ or merge manually if you need a fresh init.\n'));
    process.exit(2);
  }

  const wantKickoff = options.kickoff !== false && !nonInteractive;

  let kickoffData = null;
  if (wantKickoff) {
    printTUIHeader();
    kickoffData = await runKickoffPrompts();
    kickoffData = await confirmKickoffSummary(kickoffData);
    if (kickoffData === null) return;
  } else if (!nonInteractive) {
    console.log('\n' + chalk.bold.cyan('Welcome to Product OS Framework!'));
    console.log(chalk.gray("Scaffolding product-docs/ inside this repo.\n"));
  }

  let projName;
  if (nonInteractive) {
    projName = path.basename(cwdAtStart).replace(/[^\w.-]/g, '-') || 'project';
    if (!/^[a-zA-Z0-9_-]+$/.test(projName)) {
      projName = 'project';
    }
  } else if (wantKickoff) {
    const p = await getClack();
    const { text, isCancel, cancel } = p;
    const defaultName = path.basename(cwdAtStart);
    const proj = await text({
      message: chalk.cyan('Project name (for stories and config)'),
      placeholder: defaultName,
      initialValue: defaultName,
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
  } else {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name (for stories and config):',
        default: path.basename(cwdAtStart),
        validate: (v) => {
          if (!v.trim()) return 'Project name is required';
          if (/[^a-zA-Z0-9_-]/.test(v.trim())) return 'Use only letters, numbers, hyphens, underscores';
          return true;
        },
      },
    ]);
    projName = answers.projectName.trim();
  }

  let projDesc = '';
  if (!nonInteractive && wantKickoff) {
    const p = await getClack();
    const desc = await p.text({
      message: chalk.cyan('Project description (optional)'),
      placeholder: 'Short description of the product',
    });
    if (p.isCancel(desc)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
    projDesc = desc ? String(desc).trim() : '';
  }

  let frameworkAbs;
  if (nonInteractive) {
    const rel = process.env.PRD_FRAMEWORK_PATH || '../product-OS-framework';
    frameworkAbs = path.resolve(cwdAtStart, rel);
  } else {
    const fw = await inquirer.prompt([
      {
        type: 'input',
        name: 'frameworkPath',
        message: 'Path to product-OS-framework folder (second folder in .code-workspace):',
        default: '../product-OS-framework',
        validate: (v) => {
          const resolved = path.resolve(cwdAtStart, (v || '').trim() || '.');
          if (!fs.existsSync(resolved)) return `Path not found: ${resolved}`;
          return true;
        },
      },
    ]);
    frameworkAbs = path.resolve(cwdAtStart, fw.frameworkPath.trim());
  }

  const createdFiles = [];

  const runScaffold = () => {
    fs.mkdirSync(targetDir, { recursive: true });

    const config = {
      name: projName,
      nextId: 1,
      ignoreDirs: ['.git', 'node_modules', 'scripts', 'docs'],
      projects: {},
      processVersion: '3.0',
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    createdFiles.push(`product-docs/${CONFIG_FILENAME}`);

    const backlogTmpl = path.join(templatesDir, 'backlog.md.tmpl');
    const backlogContent = fs.existsSync(backlogTmpl)
      ? renderTemplate(backlogTmpl, { projectName: projName })
      : `# ${projName} - Backlog\n\n| ID | Title | Status | Priority | Phase |\n|----|-------|--------|----------|-------|\n`;
    writeIfMissing(targetDir, 'backlog.md', backlogContent, createdFiles);

    const projectContextVars = {
      projectName: projName,
      productDescription: kickoffData ? kickoffData.product.whatAchieving : '{To be filled}',
      targetUsers: kickoffData ? kickoffData.product.whoUsers : '{To be filled}',
      goals: kickoffData ? kickoffData.product.goals : '{To be filled}',
      constraints:
        kickoffData && kickoffData.product.constraints ? kickoffData.product.constraints : '{None identified yet}',
      commonNonGoals: '{To be filled — add product-level non-goals shared across all stories}',
    };
    const projCtxTmpl = path.join(templatesDir, 'PROJECT_CONTEXT.md.tmpl');
    const projectContextContent = fs.existsSync(projCtxTmpl)
      ? renderTemplate(projCtxTmpl, projectContextVars)
      : `# Project Context: ${projName}\n\nUpdate this file with your product context.\n`;
    writeIfMissing(targetDir, 'context/PROJECT_CONTEXT.md', projectContextContent, createdFiles);

    const techStackBlock = kickoffData
      ? `- **Stack (from kickoff):** ${kickoffData.tech.stackDescription}\n- Fill in versions and add Database/Testing as needed.`
      : '- Language:\n- Framework:\n- Database:\n- Testing:';
    const techTmpl = path.join(templatesDir, 'TECH_CONTEXT.md.tmpl');
    const techContextContent = fs.existsSync(techTmpl)
      ? renderTemplate(techTmpl, { projectName: projName, techStack: techStackBlock })
      : `# ${projName} — Technical Context\n\nDocument stack and conventions here.\n`;
    writeIfMissing(targetDir, 'context/TECH_CONTEXT.md', techContextContent, createdFiles);

    const ctxReadmeTmpl = path.join(templatesDir, 'context-README.md.tmpl');
    const contextReadmeContent = fs.existsSync(ctxReadmeTmpl)
      ? renderTemplate(ctxReadmeTmpl, { projectName: projName })
      : `# Context\n\nShared context for ${projName}.\n`;
    writeIfMissing(targetDir, 'context/README.md', contextReadmeContent, createdFiles);

    const wsFilePath = createWorkspaceFile(cwdAtStart, projName, frameworkAbs);
    createdFiles.push(path.basename(wsFilePath));

    writeIfMissing(targetDir, '.gitignore', 'node_modules/\n.DS_Store\n', createdFiles);

    return wsFilePath;
  };

  let wsFilePath;
  if (wantKickoff) {
    const p = await getClack();
    const s = p.spinner();
    s.start('Constructing product-docs…');
    wsFilePath = runScaffold();
    s.stop('Constructing product-docs…');
    p.log.success('Created:');
    createdFiles.forEach((f) => p.log.success(`  ${f}`));
    p.outro(chalk.green('Your product-docs folder is ready.'));
  } else {
    console.log(chalk.gray('\nCreating product-docs/…\n'));
    wsFilePath = runScaffold();
    console.log(chalk.green('  ✅ Created ') + chalk.white(createdFiles.join('\n  ✅ Created ')));
    console.log('\n' + chalk.bold.green('🎉 Done!\n'));
  }

  if (!nonInteractive) {
    console.log(
      chalk.gray('  Verify the framework folder path in the .code-workspace file on other machines.\n')
    );
  }

  const wsFileAbsolute = path.resolve(wsFilePath);

  console.log(chalk.white.bold('Next steps:\n'));
  console.log(chalk.cyan('  1. Create your first story (in Cursor):'));
  console.log(chalk.white(`     /create "feature description" @product-docs/backlog.md\n`));
  console.log(chalk.cyan('  2. View dashboard (from any folder in this repo):'));
  console.log(chalk.white('     prd\n'));
  console.log(chalk.gray(`  3. Optional: open the multi-root workspace → ${wsFileAbsolute}\n`));
}

module.exports = { init };
