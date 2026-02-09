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

```bash
npm install -g prd-cli
```

### 2. Create Your Workspace

```bash
prd init
```

Answer the prompts:
- Workspace name (e.g., `product-docs`)
- First project name (e.g., `my-app`)
- Path to dev repo (optional)

This creates your product docs folder, templates, and a `.code-workspace` file.

### 3. Open in Cursor

```bash
cursor your-workspace.code-workspace
```

Both your product docs and dev repo are connected automatically.

### 4. Create Your First Story

In Cursor chat:
```
/create "User authentication with OAuth" @my-app/backlog.md
```

The AI agent walks you through defining requirements, verifying quality, and extracting features.

### 5. View Dashboard

```bash
prd
```

## How It Works

### For Product Managers

1. **`/create`** - Interactive PRD creation with AI-powered refinement
2. **`/verify`** - Automated quality checks for your PRD
3. **`prd dashboard`** - See all stories across all projects

### For Developers

1. **`/dev US-001`** - AI reads the PRD + RULES.md, generates tasks, builds iteratively
2. **`/release US-001`** - Merge, deploy, document

### Workspace Structure

```
your-product-docs/
├── .prd.config.json          # Workspace config
├── PROCESS.md                # The methodology
├── README.md                 # Project registry
└── my-app/                   # Project folder
    ├── backlog.md            # Story tracking
    ├── RULES.md              # Technical standards
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

### RULES.md
Each project has a `RULES.md` defining technical standards (tech stack, patterns, testing). AI agents read this during `/dev` to ensure consistent implementation.

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
