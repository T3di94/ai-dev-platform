# Agent execution adapters

`agent-router.ts` provides the stable routing boundary for Claude, Devin, and Codex. CI uses deterministic adapters so tests do not require external credentials. Real provider adapters can implement `AgentAdapter` without changing task lifecycle or API routes.
