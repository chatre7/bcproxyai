import { getRedis } from "./redis";

// Response cache is DISABLED by default.
//
// The 5-minute TTL cache caused cross-response bleeding in agentic flows:
// n้องกุ้ง/OpenClaw sends many LLM sub-calls per user turn, and some of the
// intermediate calls (summarize, synthesize final answer) look similar
// across conversations, triggering cache hits with stale content from a
// different user query.
//
// Re-enable by setting RESPONSE_CACHE_ENABLED=1 in the environment IF
// the caller guarantees unique per-conversation message arrays (which
// agentic clients generally don't).

const CACHE_ENABLED = process.env.RESPONSE_CACHE_ENABLED === "1";
const CACHE_TTL_SEC = 300;

async function cacheKey(body: Record<string, unknown>): Promise<string> {
  const { createHash } = await import("crypto");
  const messages = body.messages;
  const model = body.model ?? "auto";
  const temperature = body.temperature ?? 0;
  const tools = body.tools ?? null;
  const payload = JSON.stringify({ model, messages, temperature, tools });
  const hash = createHash("sha256").update(payload).digest("hex").slice(0, 32);
  return `respcache:${hash}`;
}

function shouldSkip(body: Record<string, unknown>): boolean {
  if (!CACHE_ENABLED) return true;
  if (body.stream === true) return true;
  const temp = typeof body.temperature === "number" ? body.temperature : 0;
  if (temp > 0.3) return true;
  if (Array.isArray(body.tools) && (body.tools as unknown[]).length > 0) return true;
  return false;
}

export async function getCachedResponse(
  body: Record<string, unknown>,
): Promise<{ content: string; provider: string; model: string } | null> {
  if (shouldSkip(body)) return null;
  try {
    const redis = getRedis();
    const raw = await redis.get(await cacheKey(body));
    if (!raw) return null;
    return JSON.parse(raw) as { content: string; provider: string; model: string };
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  body: Record<string, unknown>,
  response: { content: string; provider: string; model: string },
): Promise<void> {
  if (shouldSkip(body)) return;
  try {
    const redis = getRedis();
    await redis.set(await cacheKey(body), JSON.stringify(response), "EX", CACHE_TTL_SEC);
  } catch {
    // silent — cache is optional
  }
}
