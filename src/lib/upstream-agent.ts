import { Agent, RetryAgent } from "undici";

/**
 * Shared HTTP dispatcher for LLM provider upstream calls (SMLGateway).
 *
 * Purpose:
 *   - Reuse keep-alive sockets across upstream chat completion calls
 *   - Transparently retry on low-level socket races (UND_ERR_SOCKET / ECONNRESET)
 *     without bubbling to the caller
 *   - Tolerate long streaming responses (SSE) without dropping the connection
 *
 * Tuning:
 *   - headersTimeout: 0 — never time out waiting for headers (caller uses AbortSignal)
 *   - bodyTimeout: 0 — never time out mid-stream (streaming LLMs can pause 30s+)
 *   - keepAliveTimeout: 10s — long enough for agentic clients to chain calls
 *   - keepAliveMaxTimeout: 60s — hard upper bound before socket is closed
 *   - connections: 256 per origin — concurrent streams for agentic workloads
 *   - connect.timeout: 15s — cold TLS on CDN edges
 *   - pipelining: 0 — streaming responses cannot be pipelined safely
 *
 * Not registered globally: each upstream callsite imports `upstreamAgent`
 * explicitly via `fetch(url, { dispatcher: upstreamAgent })`.
 */
const baseAgent = new Agent({
  keepAliveTimeout: 10_000,
  keepAliveMaxTimeout: 60_000,
  connections: 256,
  connect: { timeout: 15_000 },
  pipelining: 0,
  // Disable undici's internal timeouts — caller controls via AbortSignal.
  // Default headersTimeout=300s + bodyTimeout=300s was causing streams
  // to drop silently after 5 min on long agent workflows.
  headersTimeout: 0,
  bodyTimeout: 0,
});

export const upstreamAgent = new RetryAgent(baseAgent, {
  maxRetries: 2,
  minTimeout: 100,
  maxTimeout: 1_000,
  timeoutFactor: 2,
  retryAfter: true,
  methods: ["GET", "POST"],
  statusCodes: [], // don't retry on HTTP status — that's the app's job
  errorCodes: [
    "ECONNRESET",
    "ECONNREFUSED",
    "ENOTFOUND",
    "ENETDOWN",
    "ENETUNREACH",
    "EHOSTDOWN",
    "UND_ERR_SOCKET",
    "UND_ERR_CLOSED",
  ],
});
