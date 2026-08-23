# AI Dev Platform

Production-oriented multi-agent software workspace.

## Agents

- **Claude** — frontend and UI engineering
- **Devin** — backend and API engineering
- **Codex** — QA, testing, and regression verification

## Runtime modes

Each task can select one of three execution modes:

- **Local** — Ollama; no cloud API key required.
- **API** — configured Claude/OpenAI/Devin providers; secrets stay on the backend.
- **Mock** — deterministic, CI-safe execution without external services.

## Orchestrator

The backend exposes a deterministic Orchestrator v1 that decomposes a request into planner, backend/frontend, and QA steps, builds explicit dependencies, executes them in order, records per-attempt execution history, retries failures, enforces timeouts, and falls back to another agent when recovery is needed.

## Persistence and security

Tasks, execution records, outputs, statuses, and logs are persisted to an atomic JSON store configured with `AI_DEV_DATA_FILE`. For production, set a strong `ADMIN_TOKEN`; all mutating API routes then require `Authorization: Bearer <token>`. Basic IP rate limiting and strict task-title validation are enabled by default.

The platform never exposes provider secrets to the frontend and does not provide arbitrary shell-command execution through user task input.

## Development

```bash
pnpm install
pnpm dev
```

The initial frontend runs on port 3000 and the backend health endpoint runs on port 4000.

See `backend/.env.example` for runtime, security, persistence, local-model, and cloud-provider configuration.
See `CONTRIBUTING.md` for agent ownership and merge rules.
