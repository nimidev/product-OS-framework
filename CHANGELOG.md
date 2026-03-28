# Changelog

All notable changes to the Product OS Framework will be documented in this file.

## [3.1.0] - 2026-03-28

### Added
- **`/improve`** — documented in `CURSOR_SLASH_COMMANDS.md`: route framework vs project-context fixes, apply when `product-OS-framework` is writable, or output patch + PR instructions (US-005).
- **Learning Loops** section in `templates/PROCESS.md` (project context loop, framework loop, decision filter, workspace tip).
- **`prd init`** scaffolds `.cursor/rules/product-os.mdc` from `templates/product-os.mdc.tmpl` (Cursor MDC; skipped if the file already exists).
- Next-steps output after init mentions committing vs keeping `.cursor/rules/` local.
- `test/us005.test.js` — MDC scaffold, context paths, no clobber.

### Changed
- **`/dev`** and **`/release`** prompts in `CURSOR_SLASH_COMMANDS.md`: end-of-dev context review; release uses explicit three-question context checklist with "No context updates needed."
- **`README.md`**: documents `/improve` and updates the phases table.

## [3.0.0] - 2026-03-28

### Added
- **Co-located `product-docs/`** — run `prd init` from your **project repo root**; config lives at `product-docs/.prd.config.json` (US-004).
- Two-pass workspace discovery: nearest `product-docs/.prd.config.json`, then legacy `.prd.config.json` at an ancestor.
- Flat story layout: `US-*.md` at `product-docs/` root; dashboard uses config `name`.
- `prd init --yes` / non-TTY / `CI=true` for non-interactive scaffolding; `PRD_FRAMEWORK_PATH` for `.code-workspace` second folder.
- CLI exit codes: `1` invalid config / errors; `2` init when already initialized.
- `ConfigLoadError` when `.prd.config.json` is invalid JSON or not a JSON object.
- `test/us004.test.js` — nested cwd resolution, legacy + flat parser, config error, init idempotency.

### Changed
- **Breaking:** `prd init` no longer creates a sibling workspace folder; it always creates `./product-docs/` under cwd.
- `scanAllStories`: if any `US-*.md` exists at docs root, scan **only** that root (ignore subdir stories); else legacy per-subfolder scan.
- `prd add-project` prints a deprecation message (multi-project-in-one-repo workflow removed for new setups).
- `resolveDocsPath` / default `prd`: no longer fall back to raw `cwd` when no workspace is found.
- Docs: `README.md`, `CURSOR_SLASH_COMMANDS.md`, `templates/PROCESS.md` (v3.0), `templates/README.md.tmpl` — paths use `@product-docs/...`.
- CLI package version aligned to **3.0.0**.

### Migration
- Existing **standalone** product-docs repos (config at root + project subfolders) continue to work unchanged.
- To adopt v3: move to `your-repo/product-docs/` with flat or migrated files, run from dev repo, update Cursor prompts to `@product-docs/backlog.md`.

## [1.1.0] - 2026-03-04

### Added
- `{project}/context/` folder convention with `PROJECT_CONTEXT.md`, `TECH_CONTEXT.md`, and `README.md` (US-003)
- `templates/PROJECT_CONTEXT.md.tmpl` — product context template populated from kickoff
- `templates/context-README.md.tmpl` — context folder description
- `/create` reads `PROJECT_CONTEXT.md` to skip redundant project-level questions
- `/release` evaluates whether context files need updating after shipping
- Migration from v1 section in PROCESS.md

### Changed
- `templates/RULES.md.tmpl` renamed to `templates/TECH_CONTEXT.md.tmpl` (US-003)
- `prd init` creates `context/` folder instead of root-level `VISION.md` + `RULES.md` (US-003)
- `prd add-project` creates `context/` folder instead of root-level `RULES.md` (US-003)
- All 4 slash command prompts updated to reference context files (US-003)
- `PROCESS.md` updated to v2.1 with context folder convention (US-003)
- `README.md` workspace structure and Key Concepts updated (US-003)

### Removed
- `VISION.md` and `RULES.md` no longer generated at project root for new workspaces (US-003)

## [1.0.0] - 2026-02-03

### Added
- Initial release: slash commands (`/create`, `/verify`, `/dev`, `/release`), PRD verification, dashboard, YAML frontmatter (US-001, US-002)
- `prd init` with kickoff mode (TUI, vision, RULES) (US-002)
- GitHub Issues integration and triage workflow (US-001)
