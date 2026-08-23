import type { FastifyReply, FastifyRequest } from "fastify";

const buckets = new Map<string, { windowStart: number; count: number }>();
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX ?? 120);

export function requireAdminToken(request: FastifyRequest, reply: FastifyReply): boolean {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) return true;
  const provided = request.headers.authorization?.startsWith("Bearer ") ? request.headers.authorization.slice(7).trim() : "";
  if (!provided || provided !== expected) {
    void reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  return true;
}

export function rateLimit(request: FastifyRequest, reply: FastifyReply): boolean {
  const now = Date.now();
  const key = request.ip || "unknown";
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    reply.header("Retry-After", Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000));
    void reply.code(429).send({ error: "Rate limit exceeded" });
    return false;
  }
  return true;
}

export function validateTaskTitle(title: unknown): string | null {
  if (typeof title !== "string") return null;
  const value = title.trim();
  if (!value || value.length > 500) return null;
  if (/\0/.test(value)) return null;
  return value;
}
