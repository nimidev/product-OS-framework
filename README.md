# Product OS Framework

**Ship features faster. Keep your entire team aligned. All from your code editor.**

Product OS is a lightweight framework for running product work inside **[Cursor](https://cursor.com)**. It gives you a repeatable path from *"we should build this"* to *"it's live"*—with AI that has the full picture at every step.

---

## What makes it different

### 1. Your PRDs live inside your codebase

Most teams keep product specs in Notion, Confluence, or wherever—disconnected from the code they describe. Product OS puts your PRDs, backlog, and story history **directly inside your project repository**, alongside your source code.

This isn't just tidiness. It means when you run `/create` or `/verify`, the AI agent reads both your actual code *and* your existing PRDs—current ones and historical ones. It understands what's already been built, what constraints exist, what patterns your team follows. The result: better requirements, smarter gap detection, and fewer surprises in engineering.

No more "the spec didn't account for X"—because the spec was written with full context of X.

### 2. Product visibility baked into your repo

Every story you ship becomes a permanent record inside your codebase—defined, reviewed, built, and closed in order. Anyone with repo access can open `product-docs/` and see exactly what was planned, what was built, and what's coming next—in plain product language, no SaaS login required.

It's the simplest backlog you'll ever maintain, because it's just files.

### 3. Git workflow, handled for you

Product OS is designed so non-technical collaborators never have to think about branches, commits, or pull requests.

When you start a new story, the framework creates a dedicated branch. As you build, it manages commits. When you're done and tests pass, it creates the PR and merges to main—automatically. Your codebase stays clean, your history stays meaningful, and your team ships with confidence.

---

## The core loop

**Create → Verify → Build → Release**

Four phases. One Cursor session per phase. The AI acts as PM, tech lead, and QA reviewer at each step—but you stay in control of every decision.

| Phase | Command | What happens |
|-------|---------|--------------|
| **Shape** | `/create` | AI interviews you about the feature, then drafts a PRD with problem statement, scope, and acceptance criteria. Refined interactively until it's solid. |
| **Quality check** | `/verify` | Structured review that reads your code and previous stories to catch gaps, contradictions, and missing edge cases—*before* engineering starts. |
| **Build** | `/dev` | Implementation guided by the PRD and your codebase patterns. Branch created, commits tracked. |
| **Ship** | `/release` | PR created, reviewed, merged. Docs updated. Story closed. |
| **Process feedback** | `/improve` | Capture a framework gap and route a concrete fix to the right template or process file. |

---

## Get started

### 1. Install the CLI

You need **[Node.js](https://nodejs.org/)** (includes `npm`).

```bash
npm install -g prd-cli
```

Or clone and link locally if you want the source or to contribute:

```bash
git clone https://github.com/nimidev/product-OS-framework.git
cd product-OS-framework
npm install && npm link
```

### 2. Initialize in your project

From the root of your app:

```bash
prd init
```

This creates a `product-docs/` folder inside your project and sets up a Cursor workspace that opens your app and the framework together.

### 3. Add slash commands to Cursor

Copy the ready-made prompts from **[`CURSOR_SLASH_COMMANDS.md`](./CURSOR_SLASH_COMMANDS.md)** into Cursor. Takes ~5 minutes once. Common setup: `/create`, `/verify`, `/dev`, `/release`, `/improve`.

### 4. Write your first story

In Cursor chat, describe what you want to build and reference your backlog:

```
/create @product-docs/backlog.md — I want to add X feature
```

### 5. Check status anytime

```bash
prd
```

Colorful dashboard showing all stories, their phase, and what's blocked. Useful for standups, planning, or your own sanity.

---

## What lives where

```
your-app/
├── src/                    ← your code
├── product-docs/
│   ├── backlog.md          ← what's planned
│   ├── context/            ← project + tech context the AI reads
│   └── US-001-*.md         ← shipped
│   └── US-002-*.md         ← shipped
│   └── US-003-*.md         ← in progress
```

Everything in `product-docs/` is version-controlled with your code. Stories are just markdown files—readable by anyone, editable in any editor, trackable in git.

> **Note:** This GitHub repository only ships the CLI and templates. Your stories and backlog are created **in your project** when you run `prd init`—they are not bundled into public clones, so contributors get a clean download.

---

## Go deeper

- **[`CURSOR_SLASH_COMMANDS.md`](./CURSOR_SLASH_COMMANDS.md)** — Full prompt text for each command
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** — How to improve the framework
- **`prd --help`** — CLI options

Already using an older "separate docs repo" layout? The same `prd` CLI still discovers it—no need to migrate on day one.

---

## Built for

Teams who ship in **Cursor**, want **requirements that reflect reality**, and believe **AI should augment judgment**—not replace it.

---

## Contributing

Issues and PRs welcome. See **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## License

[MIT](LICENSE)

---

**Product OS Framework** · Built by [Nimrod Margalit](https://github.com/nimidev)
