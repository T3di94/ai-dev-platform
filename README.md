# AI Dev Platform

Production-oriented multi-agent software workspace.

## Agents

- **Claude** — frontend and UI engineering
- **Devin** — backend and API engineering
- **Codex** — QA, testing, and regression verification

## Architecture

This repository is a pnpm monorepo containing independent frontend, backend, and QA workspaces. Pull requests are validated by GitHub Actions with type checks, unit tests, builds, and Playwright end-to-end smoke tests.

## Development

```bash
pnpm install
pnpm dev
```

The initial frontend runs on port 3000 and the backend health endpoint runs on port 4000.

See `CONTRIBUTING.md` for agent ownership and merge rules.
