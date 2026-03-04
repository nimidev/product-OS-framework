# Product OS Framework

An AI-native product development lifecycle for [Cursor](https://cursor.com). From idea to production with quality gates, slash commands, and real-time visibility.

## What It Does

Product OS gives your team a structured workflow for building features:

```
PM creates & verifies PRD → Dev builds & tests → Team releases & documents
```

**Four slash commands in Cursor:**

| Command | Owner | What Happens |
|---------|-------|--------------|
| `/create` | PM | Define → Verify → Extract Features → PRD approved |
| `/verify` | PM | Quality check any PRD |
| `/dev` | Developer | Kickoff → Code → Test → PR ready |
| `/release` | Team | Review → Merge → Deploy → Document |

> Note: Throughout this README we assume the command names `/create`, `/verify`, `/dev`, and `/release`.  
> You can choose different names when you configure them as Cursor slash commands—see `CURSOR_SLASH_COMMANDS.md` for details.

**Plus a CLI dashboard:**

```
$ prd

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 PRODUCT STORIES DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  Total Stories:     5
  Average Progress:  30%
  Blocked:           0

delivery-api (4 stories)
  US-001  ✅ Done  P0
    Real-time order tracking
    ████████████ 100%

  US-002  🔨 In Dev  P1
    Restaurant menu management
    ██████░░░░░░ 50%
```

## Quick Start

### 1. Install

If you are non-technical: the command below is run in your **Terminal** app (macOS: search for "Terminal" in Spotlight).  
`npm` is a standard tool that comes with [Node.js](https://nodejs.org/). If `npm` is not recognized, install Node.js first or ask a developer to help with this one-time setup.

```bash
npm install -g prd-cli
```

### 2. Create Your Workspace

```bash
prd init
```

Answer the prompts:
- **Workspace name** – the folder that will hold **all** your product docs (for all projects), e.g. `product-docs`
- **First project name** – a single product or codebase inside that workspace, e.g. `my-app`
- **Path to dev repo (optional)** – where the code for that first project lives, so Cursor can open docs + code together

This creates your product docs folder, templates, and a `.code-workspace` file.

### 3. Open in Cursor

```bash
cursor your-workspace.code-workspace
```

Both your product docs and dev repo are connected automatically.

### 4. Configure Cursor Slash Commands

Before creating your first story, set up the slash commands in Cursor that trigger each phase (for example `/create`, `/verify`, `/dev`, `/release`).

Product OS assumes you will trigger each phase from a dedicated slash command in Cursor. These commands are **not** created automatically by `prd-cli` — you define them once in Cursor using the prompts in:

- [`CURSOR_SLASH_COMMANDS.md`](./CURSOR_SLASH_COMMANDS.md)

After you add them, the slash commands and this framework work together:

- The **slash commands** drive the conversational workflow in Cursor.
- The **CLI** (`prd`) gives you a dashboard and stats across all stories.

### 5. Create Your First Story

In Cursor chat:
```
/create "User authentication with OAuth" @my-app/backlog.md
```

The AI agent walks you through defining requirements, verifying quality, and extracting features.

### 6. View Dashboard

```bash
prd
```

## How It Works

### Phase 1 – Create & Verify (PRD)

Goal: go from idea to a clear, verified PRD with extracted features and tasks.

- Start in Cursor with: `/create "feature description" @my-app/backlog.md` (always tag the **backlog file of the specific project** you want to create the story in)
- Refine the requirements through a conversation with the agent.
- Run verification to find gaps and either auto-apply or manually fix suggestions.
- Exit when the PRD is approved and the story is tracked in `backlog.md`.

### Phase 2 – Dev (Implementation)

Goal: implement the story according to the PRD and project context, with tests and a ready PR.

- Start or resume with: `/dev US-{ID}`
- The agent:
  - Loads the PRD, backlog entry, and project context (`context/TECH_CONTEXT.md`)
  - Proposes a plan and tasks
  - Iterates through: code → tests → AC verification
- Exit when all tasks are done, tests pass, ACs are covered, and a PR is ready.

### Phase 3 – Release (Ship & Document)

Goal: review, merge, deploy, and update documentation so the story is fully shipped.

- Start with: `/release US-{ID}`
- The agent:
  - Reviews AC checklist, tests, and PR status
  - Helps you merge and deploy via your existing pipeline
  - Updates `CHANGELOG`, PRD status, and backlog
- Exit when the story is live in production and marked **done** in docs and code.

### Workspace Structure

```
your-product-docs/
├── .prd.config.json          # Workspace config
├── PROCESS.md                # The methodology
├── README.md                 # Project registry
└── my-app/                   # Project folder
    ├── backlog.md            # Story tracking
    ├── context/              # Shared project context
    │   ├── PROJECT_CONTEXT.md  # Product, users, goals
    │   └── TECH_CONTEXT.md     # Tech stack, conventions
    ├── US-001.md             # Story files
    └── US-002.md
```

Each project folder contains stories (`US-*.md`) with YAML frontmatter that powers the dashboard and slash commands.

## CLI Commands

| Command | Description |
|---------|-------------|
| `prd init` | Create a new product workspace |
| `prd add-project` | Add another project |
| `prd` or `prd dashboard` | Full stories dashboard |
| `prd list` | Compact list view |
| `prd stats` | Quick statistics |
| `prd dashboard --status done` | Filter by status |
| `prd dashboard --phase dev` | Filter by phase |

## Key Concepts

### Quality Gates
Every PRD goes through automated verification before development starts. Gaps are identified and suggested fixes offered.

### Context Folder
Each project has a `context/` folder with two shared files:
- **`PROJECT_CONTEXT.md`** — Product description, target users, goals, constraints, common non-goals. Used by `/create` to skip redundant project-level questions and by all commands for consistent context.
- **`TECH_CONTEXT.md`** — Technical stack, patterns, conventions, testing. AI agents read this during `/dev` to ensure consistent implementation.

### YAML Frontmatter
Stories include metadata that powers the dashboard:

```yaml
---
id: US-001
project: my-app
status: dev
phase: development
progress: 50
priority: P0
---
```

### Global Story IDs
Stories use globally unique IDs (`US-001`, `US-002`, ...) across all projects. No conflicts, easy cross-referencing.

## Built For

- **Cursor IDE** - Slash commands powered by AI agents
- **Small teams** - PMs + Developers working together
- **Multiple projects** - One workspace, many products
- **AI-native development** - Quality gates designed for LLM-assisted workflows

## Industry Alignment

| Product OS | Maps To |
|------------|---------|
| `/create` + `/verify` | **Dual-Track Agile** Discovery / **Shape Up** Shaping |
| `/dev` | **Dual-Track Agile** Delivery / **Shape Up** Building |
| `/release` | **Lean** Measure / **Shape Up** Shipping |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

---

**Product OS Framework** - Built by [Nimrod Margalit](https://github.com/nimidev)
