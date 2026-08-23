import type { FastifyInstance } from "fastify";
import { runSandboxed } from "./sandbox.js";

export async function registerSandboxRoute(app: FastifyInstance) {
  app.post<{ Body: { command?: string; args?: string[] } }>("/sandbox/run", async (request, reply) => {
    const command = request.body?.command?.trim();
    const args = request.body?.args ?? [];
    if (!command) return reply.code(400).send({ error: "command is required" });
    if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string")) return reply.code(400).send({ error: "args must be an array of strings" });
    try {
      return await runSandboxed(command, args);
    } catch (error) {
      return reply.code(400).send({ error: error instanceof Error ? error.message : "Sandbox request rejected" });
    }
  });
}
