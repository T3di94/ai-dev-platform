# AI Development Workflow

## Roles

### Claude — Frontend
- Owns `frontend/` and frontend-facing UI code.
- Responsible for UX, accessibility, responsive behavior, and frontend tests.
- Must not modify backend business logic or database migrations unless explicitly requested.

### Devin — Backend
- Owns `backend/` and server-side code.
- Responsible for APIs, authentication, business logic, persistence, validation, and backend tests.
- Must document API contract changes.

### Codex — QA
- Owns `qa/` and the test/quality workflow.
- Reviews frontend and backend changes.
- Adds unit, integration, API, and end-to-end coverage where appropriate.
- Reports defects instead of silently changing feature behavior.

## Git Workflow

- `main` is production-ready.
- Work happens on dedicated branches.
- Frontend work uses `frontend/claude` or a feature branch derived from it.
- Backend work uses `backend/devin` or a feature branch derived from it.
- QA work uses `qa/codex` or a feature branch derived from it.
- Changes reach `main` through pull requests.
- Every pull request must pass automated checks before merge.

## Quality Gate

A change is merge-ready only when:

1. The application builds successfully.
2. Type checking passes.
3. Linting passes.
4. Relevant unit/integration tests pass.
5. Relevant end-to-end tests pass.
6. API contracts remain compatible or are explicitly versioned/updated.
7. No secrets are committed.
8. A preview deployment is available for UI changes when configured.
9. Codex/QA has verified the change or explicitly marked the risk as accepted.

## Change Rules

- Keep changes small and focused.
- Do not overwrite another agent's work without explicit coordination.
- Do not commit generated secrets, `.env` files, tokens, or credentials.
- Update documentation when architecture or public API behavior changes.
- Prefer backwards-compatible changes.
