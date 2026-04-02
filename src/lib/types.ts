// === Provider Types ===

export type ProviderName = "openrouter" | "kilo" | "google" | "groq";

export interface FreeModel {
  id: string;
  name: string;
  provider: ProviderName;
  modelId: string; // provider-specific model ID
  contextLength: number;
  description?: string;
  rateLimit?: string;
  addedAt?: string; // ISO date when first discovered
  tags?: string[];
}

// === Benchmark Types ===

export type ExamCategory = "coding" | "reasoning" | "thai" | "tool-use";

export interface ExamQuestion {
  id: string;
  category: ExamCategory;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  expectedBehavior: string; // what a good answer should contain
  maxScore: number;
}

export interface ExamSet {
  id: string;
  createdAt: string;
  questions: ExamQuestion[];
}

export interface BenchmarkResult {
  id: string;
  modelId: string;
  provider: ProviderName;
  examSetId: string;
  questionId: string;
  category: ExamCategory;
  answer: string;
  score: number;
  maxScore: number;
  reasoning: string; // judge's reasoning
  latencyMs: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  modelId: string;
  modelName: string;
  provider: ProviderName;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  categoryScores: Record<ExamCategory, { score: number; max: number }>;
  avgLatencyMs: number;
  lastBenchmarkAt: string;
}

// === Chat Types ===

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatSession {
  id: string;
  modelId: string;
  provider: ProviderName;
  messages: ChatMessage[];
  createdAt: string;
}

// === Config Export Types ===

export interface OpenClawConfig {
  apiProvider: string;
  apiModelId: string;
  openRouterApiKey?: string;
  kiloApiKey?: string;
  openRouterModelId?: string;
}

export interface HiClawConfig {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey?: string;
}
