import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb before importing the module
const mockRun = vi.fn(() => ({ changes: 1 }));
const mockGet = vi.fn();
const mockAll = vi.fn(() => []);
const mockPrepare = vi.fn(() => ({
  run: mockRun,
  get: mockGet,
  all: mockAll,
}));
const mockTransaction = vi.fn((fn: Function) => (...args: unknown[]) => fn(...args));
const mockDb = {
  prepare: mockPrepare,
  transaction: mockTransaction,
};

vi.mock("@/lib/db/schema", () => ({
  getDb: vi.fn(() => mockDb),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { calcTier, scanModels } from "../scanner";

describe("calcTier", () => {
  it("returns 'large' for context >= 128000", () => {
    expect(calcTier(128000)).toBe("large");
    expect(calcTier(200000)).toBe("large");
    expect(calcTier(1000000)).toBe("large");
  });

  it("returns 'medium' for context >= 32000 and < 128000", () => {
    expect(calcTier(32000)).toBe("medium");
    expect(calcTier(64000)).toBe("medium");
    expect(calcTier(127999)).toBe("medium");
  });

  it("returns 'small' for context < 32000", () => {
    expect(calcTier(0)).toBe("small");
    expect(calcTier(8000)).toBe("small");
    expect(calcTier(31999)).toBe("small");
  });
});

describe("scanModels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRun.mockReturnValue({ changes: 1 });
    mockAll.mockReturnValue([]);
    mockTransaction.mockImplementation((fn: Function) => (...args: unknown[]) => fn(...args));
  });

  it("fetches from all 4 providers and returns counts", async () => {
    // OpenRouter — 1 free model
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "meta/llama-3:free",
              name: "Llama 3",
              pricing: { prompt: "0" },
              context_length: 128000,
              description: "Test model",
            },
          ],
        }),
      })
      // Kilo — 1 free model
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "qwen/qwen-2:free",
              name: "Qwen 2",
              context_length: 32000,
            },
          ],
        }),
      })
      // Google — 1 model
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            {
              name: "models/gemini-2.0-flash",
              displayName: "Gemini 2.0 Flash",
              inputTokenLimit: 1000000,
              supportedGenerationMethods: ["generateContent"],
              description: "Fast model",
            },
          ],
        }),
      })
      // Groq — 1 model
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "llama-3-70b",
              context_window: 8000,
            },
          ],
        }),
      });

    const result = await scanModels();

    // OpenRouter has 1 free model, Kilo has 0 (no :free suffix), Google has 1, Groq has 1
    // Kilo filters by `:free` suffix so qwen/qwen-2:free matches
    expect(result.found).toBe(4);
    expect(result.new).toBe(4);
    expect(result.disappeared).toBe(0);
  });

  it("filters OpenRouter to only free models (pricing.prompt === '0')", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "model-a", name: "A", pricing: { prompt: "0" }, context_length: 8000 },
            { id: "model-b", name: "B", pricing: { prompt: "0.001" }, context_length: 8000 },
          ],
        }),
      })
      // Other providers return empty
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const result = await scanModels();
    // Only model-a is free
    expect(result.found).toBe(1);
  });

  it("filters Kilo to only :free models", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "model-a:free", name: "A Free", context_length: 8000 },
            { id: "model-b", name: "B Paid", context_length: 8000 },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const result = await scanModels();
    expect(result.found).toBe(1);
  });

  it("filters Google to only generateContent models", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          models: [
            {
              name: "models/gemini-flash",
              displayName: "Gemini Flash",
              inputTokenLimit: 128000,
              supportedGenerationMethods: ["generateContent"],
            },
            {
              name: "models/embedding-001",
              displayName: "Embedding",
              inputTokenLimit: 2048,
              supportedGenerationMethods: ["embedContent"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const result = await scanModels();
    expect(result.found).toBe(1);
  });

  it("handles fetch error gracefully and returns 0 for that provider", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error")) // OpenRouter fails
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const result = await scanModels();
    expect(result.found).toBe(0);
  });

  it("handles HTTP error status gracefully", async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 }) // OpenRouter 500
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const result = await scanModels();
    expect(result.found).toBe(0);
  });

  it("counts new models when insertStmt returns changes > 0", async () => {
    mockRun.mockReturnValue({ changes: 1 });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "m1:free", name: "M1", pricing: { prompt: "0" }, context_length: 8000 },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const result = await scanModels();
    expect(result.new).toBe(1);
  });

  it("does not count as new when model already exists (changes === 0)", async () => {
    mockRun.mockReturnValue({ changes: 0 });

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "existing:free", name: "Existing", pricing: { prompt: "0" }, context_length: 8000 },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    const result = await scanModels();
    expect(result.new).toBe(0);
  });

  it("detects disappeared models (last_seen > 48h and not in current scan)", async () => {
    // All providers empty
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });

    // The "recent models" query uses prepare().all()
    // scanModels calls prepare multiple times — we need the disappeared models query
    // to return a model with last_seen > 48h ago
    const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
    const lastSeen = fiftyHoursAgo.toISOString().replace("T", " ").slice(0, 19);

    // mockAll is the default return from mockPrepare().all()
    // It gets called for the disappeared models query
    mockAll.mockReturnValue([
      { id: "openrouter:gone-model", name: "Gone Model", provider: "openrouter", last_seen: lastSeen },
    ]);

    const result = await scanModels();
    expect(result.disappeared).toBe(1);
  });
});
