# Changelog

All notable changes to the Product OS Framework will be documented in this file.

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
