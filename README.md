# Product OS Framework

**Turn ideas into shipped features—without losing the plot.**  

Product OS is a lightweight way to run product work inside **[Cursor](https://cursor.com)**. You get a clear path from *“we should build this”* to *“it’s live and documented,”* with your AI assistant acting like a focused PM and tech lead at each step. Your specs, backlog, and story files **live next to your code**, so product and engineering stay in sync.

---

## Why teams use it

- **Less thrash.** One repeatable flow: shape the idea, check quality, build, ship—instead of ad‑hoc docs and forgotten Notion pages.
- **Better AI conversations.** Cursor slash commands give the model the *right* job at the *right* time (write the PRD, review it, implement it, close the loop).
- **Visibility for everyone.** A simple terminal dashboard shows what’s in progress, blocked, or done—no extra SaaS required.
- **You own your work.** Everything important stays in **your** repository. This framework repo is just the tooling and templates.

---

## How it feels in practice

You’re not juggling fifteen templates. You’re moving a story through four natural phases:

**Create → Verify → Build → Release**

That’s it. Under the hood, Cursor runs four slash commands (you can rename them if you like). Together they keep requirements tight, code aligned, and shipping disciplined.

---

## Get started (simple path)

### 1. Install once

You need **[Node.js](https://nodejs.org/)** on your machine (it includes `npm`). New to the terminal on Mac? Open **Terminal** from Spotlight—or ask a teammate for a five-minute setup.

Pick **one** of these:

**A — Install from npm (easiest for most teams)**  

```bash
npm install -g prd-cli
```

**B — Clone this repo (good if you want the source, a pinned version, or to contribute)**  

```bash
git clone https://github.com/nimidev/product-OS-framework.git
cd product-OS-framework
npm install
npm link
```

That registers the **`prd`** command on your computer from your local copy. Later, `git pull` in that folder to update, then run `prd` as usual.

*(Advanced: you can also run `node path/to/product-OS-framework/bin/prd.js` without linking.)*

### 2. Add Product OS to your project

Go to the **top folder of the app you’re building**—the same place your main code lives—and run:

```bash
cd /path/to/your-app
prd init
```

Answer the prompts (or say hello to the guided kickoff). Product OS will set up a dedicated **product-docs** area inside that project and can create a **workspace file** so Cursor can open your app and the framework together. You don’t need to memorize file names; the setup is guided.

### 3. Wire up Cursor (one-time)

Slash commands are defined **in Cursor**, not installed automatically. Copy the ready-made prompts from **[`CURSOR_SLASH_COMMANDS.md`](./CURSOR_SLASH_COMMANDS.md)** into four commands—many teams call them `/create`, `/verify`, `/dev`, and `/release`. Takes a few minutes once; then the whole team benefits.

### 4. Write your first story

In Cursor chat, describe what you want to build and point at your backlog—Product OS uses a path like **`@product-docs/backlog.md`** so the agent knows where to track the work.

### 5. Glance at the big picture

From your project folder, run:

```bash
prd
```

You’ll see a colorful overview of stories, status, and progress—useful for standups, planning, or your own peace of mind.

---

## Your four phases in Cursor

| Phase | Typical command | What you get |
|--------|-----------------|--------------|
| **Shape** | `/create` | A real PRD: problem, scope, acceptance criteria—refined with the AI until it’s solid. |
| **Quality check** | `/verify` | A structured review that finds gaps *before* engineering invests weeks. |
| **Build** | `/dev` | Implementation guided by the PRD and your team’s standards. |
| **Ship** | `/release` | Merge, deploy, and documentation so nothing falls through the cracks. |

*(You can use different command names—see the Cursor setup doc above.)*

---

## A peek at the dashboard

```text
$ prd

  📊 PRODUCT STORIES DASHBOARD

  Summary: 5 stories · avg progress · what’s blocked

  Your stories appear here with status and progress—
  so the whole team sees the same picture.
```

---

## What lives in your repo

Product OS keeps product artifacts **alongside your code**—backlog, story files, and a small **context** folder the AI reads so it doesn’t re-ask “who is the user?” on every feature. You stay in control; nothing is locked in a vendor silo.

> **Note:** This **GitHub repository** only ships the CLI and templates. Your stories and backlog are created **in your project** when you run `prd init`—they are not bundled into public clones, so contributors get a clean download.

---

## If you want to go deeper

- **[`CURSOR_SLASH_COMMANDS.md`](./CURSOR_SLASH_COMMANDS.md)** — Full prompt text for each phase.  
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** — How to improve the framework.  
- **`prd --help`** — Command-line options when you need them.

Already using an older “separate docs repo” layout? The same **`prd`** CLI still discovers it—no need to migrate on day one.

---

## Built for

Teams who ship in **Cursor**, care about **clear requirements**, and want **AI that augments** product and engineering—not replaces judgment.

---

## Contributing

We welcome issues and PRs. See **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## License

[MIT](LICENSE)

---

**Product OS Framework** · Built by [Nimrod Margalit](https://github.com/nimidev)
