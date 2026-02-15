# Changelog

All notable changes to the Product OS Framework are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- **GitHub Issues integration & triage** (US-001)
  - Issue templates: `.github/ISSUE_TEMPLATE/feature_request.md` and `bug_report.md` (Problem Statement, Expected Behavior; label: triage).
  - `/create from #123` in Cursor: create a story from a GitHub Issue; PRD prefilled from Issue body; `source_issue` in story frontmatter.
  - Parser: optional `source_issue` in story metadata for traceability.
  - CLI: `prd` and `prd stats` show count of open Issues with label `triage` (via `gh`; N/A when `gh` not available).
  - PROCESS.md: "Triage Workflow" section (issue lifecycle, labels `triage` / `story-created` / `released`, PR `Fixes #N` → merge closes Issue).
  - `/dev` and `/release` prompts: PR description must include `Fixes #<issue_id>` when story has `source_issue`.

## [1.0.0] - Initial release

- Slash commands: `/create`, `/verify`, `/dev`, `/release`
- CLI: `prd`, `prd dashboard`, `prd stats`, `prd list`
- Templates: PROCESS.md, README, backlog, RULES
