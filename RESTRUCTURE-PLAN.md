# Product OS Framework — Restructure Plan v3.0
## "Product-docs inside the project repo" architecture

**Status:** Pending review (Resolved Decisions aligned with US-004 / §3 — 2026-03-28)
**Prepared:** 2026-03-28
**Scope:** Framework update + podcast-summarizer migration

---

## What We're Changing and Why

Today the framework assumes `product-docs/` is a **separate repo** sitting alongside dev repos. The new model co-locates product docs **inside** the project repo:

```
Before (old):                         After (new):
─────────────────────────────         ─────────────────────────────
product-docs/          ← own repo     podcast-summarizer/   ← one repo
  podcast-summarizer/                   src/
    backlog.md                          tests/
    context/                            CHANGELOG.md
    US-XXX.md                           product-docs/       ← lives here
podcast-summarizer/    ← own repo         backlog.md
  src/                                    context/
  tests/                                    PROJECT_CONTEXT.md
                                            TECH_CONTEXT.md
                                          US-XXX.md
                                          .prd.config.json

product-OS-framework/  ← unchanged   product-OS-framework/ ← unchanged
```

The Cursor workspace shrinks from 3 roots to 2: `podcast-summarizer/` + `product-OS-framework/`.

---

## Git Status Check

Local repo is **in sync** with `origin/main` (confirmed). The only local change is a trivial `package.json` path tweak (`"prd": "./bin/prd.js"` → `"prd": "bin/prd.js"`). This can be committed as part of this work.

---

## Files Affected

| File | Change Size | Summary |
|------|-------------|---------|
| `lib/config.js` | Medium | Update `findWorkspaceRoot()` to locate `product-docs/.prd.config.json` inside a project repo |
| `lib/parser.js` | Medium | Update `scanAllStories()` to read stories directly from `product-docs/` (flat, single project) |
| `lib/commands/init.js` | Large | Rewrite to scaffold `product-docs/` inside the current dir instead of creating a separate workspace folder |
| `lib/commands/add-project.js` | Small | Deprecate gracefully with a clear message explaining the new model |
| `bin/prd.js` | Small | Update `resolveDocsPath()` to check for `./product-docs/` from project root |
| `templates/PROCESS.md` | Medium | Update workspace structure diagram, all `@` reference examples, path patterns |
| `CURSOR_SLASH_COMMANDS.md` | Medium | Update workspace setup description and all path references in command prompts |
| `README.md` | Medium | Update Quick Start, workspace structure section, and examples |
| `templates/README.md.tmpl` | Small | Remove multi-project sections; simplify for single-project model |
| `CHANGELOG.md` | Small | Add v3.0 entry |

---

## Detailed Changes

### 1. `lib/config.js` — Update `findWorkspaceRoot()`

**Problem today:** Walks up from `cwd` looking for `.prd.config.json` at the workspace root. This works when `product-docs/` is the workspace root, but not when `.prd.config.json` lives at `{project}/product-docs/.prd.config.json`.

**New behavior:** Two-pass detection.

Pass 1 — Check if cwd or any ancestor contains a `product-docs/` subfolder with `.prd.config.json` inside it. If found, return the `product-docs/` path.

Pass 2 (backward compat) — Check if cwd or any ancestor directly contains `.prd.config.json` (old structure). If found, return that path.

This means running `prd` from anywhere inside `podcast-summarizer/` (root, `src/`, `product-docs/`) all resolve to `podcast-summarizer/product-docs/` correctly.

No changes to `loadConfig()`, `saveConfig()`, or `applyDefaults()`.

---

### 2. `lib/parser.js` — Update `scanAllStories()`

**Problem today:** Looks for project subdirectories (e.g., `podcast-summarizer/`) inside the workspace and scans `US-*.md` within each. This was designed for multi-project workspaces.

**New behavior:** When `product-docs/` is a single-project folder (has `.prd.config.json` with a single project), scan `US-*.md` files directly in the `product-docs/` root (no subdirectory level).

Backward compat: If `product-docs/` contains subdirectories with `US-*.md` inside them (old structure), still handle those. Detection is based on whether `US-*.md` files exist at the root vs inside subdirectories.

The project name for grouping in the dashboard comes from `.prd.config.json` → `name` field.

---

### 3. `lib/commands/init.js` — Rewrite scaffold logic

**Problem today:** Prompts for a "workspace folder name" (default `product-docs`) and creates it as a sibling to the cwd. This made sense when product-docs was a separate repo. Now it should be a subfolder of the project.

**New behavior:**

- Remove the "workspace folder name" question entirely. The folder is always `product-docs/` inside the current directory.
- Keep the kickoff prompts (product context, tech stack) — these are valuable and unchanged.
- Keep the "project name" prompt, but default it to the current directory name.
- Remove the "do you have an existing dev repo?" question. The current directory IS the dev repo.
- Create `product-docs/` as a subfolder of `process.cwd()`, not as a sibling.
- Scaffold inside `product-docs/` (flat — no subdirectory per project):
  - `.prd.config.json`
  - `backlog.md`
  - `context/PROJECT_CONTEXT.md`
  - `context/TECH_CONTEXT.md`
  - `context/README.md`
- Generate (or update) a `.code-workspace` file at the project root with:
  - Folder 1: `.` (the project itself, name = project name)
  - Folder 2: second folder path — **prompt** for `product-OS-framework` location; default suggestion `../product-OS-framework` (user may override). *JSON does not allow comments;* print a one-line reminder after write: verify the framework folder path on other machines.
- **If `product-docs/` already exists:** If `product-docs/.prd.config.json` exists → **abort** init with a clear message (already initialized). If the folder exists but config is missing → **continue** by creating **only missing** scaffold files; never overwrite existing `US-*.md`, `backlog.md`, or populated context without explicit future `--force` (out of scope for v3 unless added later).
- Next steps message updated: "Open `podcast-summarizer.code-workspace` in Cursor, then `/create "feature" @product-docs/backlog.md`"

**What this looks like after `prd init` runs inside `podcast-summarizer/`:**

```
podcast-summarizer/
├── podcast-summarizer.code-workspace   ← NEW
├── product-docs/                       ← NEW
│   ├── .prd.config.json
│   ├── backlog.md
│   └── context/
│       ├── PROJECT_CONTEXT.md
│       ├── TECH_CONTEXT.md
│       └── README.md
└── [existing src/, tests/, etc. untouched]
```

---

### 4. `lib/commands/add-project.js` — Deprecate gracefully

**Problem today:** Designed to add a second project subfolder inside a shared `product-docs/` workspace. That concept doesn't exist in the new model.

**New behavior:** When called, print a clear deprecation message:

```
ℹ  add-project is no longer needed with the new structure.
   Each project is its own repo with product-docs/ inside it.
   To start a new project: cd into your new project repo and run prd init.
```

The file stays, just the action changes. No code deletion so existing users on the old structure aren't broken.

---

### 5. `bin/prd.js` — Update `resolveDocsPath()`

**Problem today:** Calls `findWorkspaceRoot()` from `process.cwd()` and falls back to `cwd` itself. Works for old structure.

**New behavior:** After `findWorkspaceRoot()` (which is now smarter), add one more check: if `./product-docs/` exists in cwd and contains `.prd.config.json`, use that. The updated `findWorkspaceRoot()` in config.js handles this — `resolveDocsPath()` in prd.js just needs to trust it.

Minor: Update the "no workspace found" message to say:
`"Run prd init from inside your project repo to create product-docs/."`

---

### 6. `templates/PROCESS.md` — Update structure + path references

**Changes:**

a) **Workspace Setup section** — Replace the "two separate repos" model:

```
Before:
  Your Cursor workspace needs two folders:
  1. product-docs — PRDs, backlogs, process, project context
  2. dev repo (e.g., my-app) — code, tests, docs

After:
  Your Cursor workspace needs two folders:
  1. Your project repo (e.g., podcast-summarizer) — code, tests, CHANGELOG,
     and a product-docs/ subfolder with PRDs and context
  2. product-OS-framework — the framework itself (for slash command reference)
```

b) **Repository Structure section** — Replace the two-repo diagram:

```
Before:
  product-docs/
  ├── PROCESS.md
  └── {project-name}/
      ├── backlog.md
      ├── context/
      └── US-XXX.md

  {project-name}/
  ├── src/
  └── CHANGELOG.md

After:
  {project-name}/                       ← your dev repo
  ├── src/
  ├── tests/
  ├── CHANGELOG.md
  └── product-docs/                     ← PRDs live here
      ├── .prd.config.json
      ├── backlog.md
      ├── context/
      │   ├── PROJECT_CONTEXT.md
      │   ├── TECH_CONTEXT.md
      │   └── README.md
      └── US-XXX.md
```

c) **All `@` reference examples** — Update paths:

```
Before:  @{project-name}/backlog.md
After:   @product-docs/backlog.md

Before:  @{project-name}/context/PROJECT_CONTEXT.md
After:   @product-docs/context/PROJECT_CONTEXT.md

Before:  /create "description" @{project-name}/backlog.md
After:   /create "description" @product-docs/backlog.md
```

d) **Story Referencing section** — Update all `@` tag examples to use `@product-docs/`.

e) **Version History** — Add v3.0 entry.

---

### 7. `CURSOR_SLASH_COMMANDS.md` — Update workspace setup + command prompts

**Changes:**

a) **Common Setup section** — Update the "All commands assume" block:

```
Before:
  You have a product docs repo (e.g. product-docs) containing...
  You open a Cursor workspace that includes:
  - product-docs
  - the relevant dev repo (e.g. my-app)

After:
  Your project repo (e.g. podcast-summarizer) contains a product-docs/ subfolder with:
  - backlog.md
  - context/PROJECT_CONTEXT.md
  - context/TECH_CONTEXT.md
  - US-XXX.md story files
  You open a Cursor workspace that includes:
  - the project repo (e.g. podcast-summarizer)
  - product-OS-framework (for slash command reference)
```

b) **All four command prompts** — Update path references inside the prompt text:

```
Before:  {project}/backlog.md → After: product-docs/backlog.md
Before:  {project}/context/PROJECT_CONTEXT.md → After: product-docs/context/PROJECT_CONTEXT.md
Before:  {project}/context/TECH_CONTEXT.md → After: product-docs/context/TECH_CONTEXT.md
Before:  {project}/US-XXX.md → After: product-docs/US-XXX.md
```

c) **Typical usage examples** in each command:

```
Before:  /create "Add email notifications" @project/backlog.md
After:   /create "Add email notifications" @product-docs/backlog.md
```

---

### 8. `README.md` — Update Quick Start + workspace structure

**Changes:**

a) **Quick Start step 2** ("Create Your Workspace"):
- Change description to say "Run this from inside your project repo"
- Remove the "workspace name" prompt description
- Update what gets created

b) **Quick Start step 3** ("Open in Cursor"):
- Update to `cursor {project-name}.code-workspace`

c) **Quick Start step 5** ("Create Your First Story"):
- Update example: `@product-docs/backlog.md` instead of `@my-app/backlog.md`

d) **Workspace Structure section** — Replace diagram to match new structure.

e) **CLI Commands table** — Update description for `prd init`.

---

### 9. `templates/README.md.tmpl` — Simplify for single-project

Remove the "Adding a New Project" section (references `prd add-project`). Update `@` tag examples throughout.

---

## Podcast-Summarizer Migration

Once framework changes are committed to `product-OS-framework`, these steps apply to your local Cursor workspace for `podcast-summarizer`:

### Step 1 — Create `product-docs/` inside the project

```
podcast-summarizer/
└── product-docs/            ← create this
    ├── .prd.config.json
    ├── backlog.md
    └── context/
        ├── PROJECT_CONTEXT.md
        ├── TECH_CONTEXT.md
        └── README.md
```

I can generate these files directly with the right content pre-filled.

### Step 2 — Move any existing PRDs

If there are existing `US-XXX.md` files anywhere (in the old `product-docs` repo or elsewhere), move them to `podcast-summarizer/product-docs/`. Update the `nextId` in `.prd.config.json` to reflect the next available ID. If the project keeps a **Next Available ID** line in `product-docs/README.md`, update that too so `/create` stays consistent.

### Step 3 — Create the `.code-workspace` file

Create `podcast-summarizer.code-workspace` at the project root:

```json
{
  "folders": [
    { "name": "podcast-summarizer", "path": "." },
    { "name": "product-OS-framework", "path": "../product-OS-framework" }
  ],
  "settings": {}
}
```

The relative path `../product-OS-framework` assumes both repos sit in the same parent directory on your machine. If not, this path needs adjusting.

### Step 4 — Update Cursor slash commands

In Cursor settings, update the four slash command prompts to use the new path references (`@product-docs/backlog.md` etc). The updated prompts are in the revised `CURSOR_SLASH_COMMANDS.md`.

### Step 5 — Retire the standalone `product-docs` repo

The `nimidev/product-docs` GitHub repo is no longer needed. Archive it or leave it as is — either is fine. Do not delete in case anything references it.

---

## What Does NOT Change

- Story file format (YAML frontmatter, US-XXX.md naming)
- The four phases and their logic (/create, /verify, /dev, /release)
- Kickoff prompts in `prd init`
- GitHub Issues triage workflow
- Dashboard display and stats
- Template file content (PROJECT_CONTEXT, TECH_CONTEXT, backlog)
- All CLI commands except `add-project` (deprecated)

---

## Execution Order

When approved, changes will be made in this sequence:

1. `lib/config.js` — foundation, everything depends on this
2. `lib/parser.js` — depends on config
3. `lib/commands/init.js` — depends on config
4. `lib/commands/add-project.js` — quick deprecation
5. `bin/prd.js` — depends on config
6. `templates/PROCESS.md` — docs
7. `CURSOR_SLASH_COMMANDS.md` — docs
8. `README.md` — docs
9. `templates/README.md.tmpl` — docs
10. `CHANGELOG.md` — last, summarizes everything
11. Commit to `product-OS-framework` repo
12. Scaffold `podcast-summarizer/product-docs/` — migration
13. Create `podcast-summarizer.code-workspace` — migration

---

## Resolved Decisions

1. **Framework path in `.code-workspace`:** Default suggestion `../product-OS-framework` when the user runs `prd init` from a sibling repo layout; **always confirm or allow override** at prompt (do not rely on a single machine’s path). Remind in CLI output that `.code-workspace` paths are local.

2. **Existing PRDs to migrate:** Existing podcast-summarizer PRDs live at:
   `/Users/nimrodmargalit/Documents/product-docs/podcast-summarizer/`
   All files there (US-XXX.md, backlog.md, context/) will be moved into `podcast-summarizer/product-docs/` as part of Step 12.

3. **`prd init` project root (locked):** **Option A — strict co-location.** The project root is always **`process.cwd()`** (the directory from which the user ran `prd init`). No prompt for “path to another repo” and no `prd init` that scaffolds a new sibling folder as the primary flow. Users who need a different root run `cd` first or use a wrapper script. This matches §3 above and removes the earlier alternate flow.
