"use client";

import {
  GlowDot,
  Skeleton,
  PROVIDER_COLORS,
  TIER_LABELS,
  TIER_COLORS,
  fmtCooldown,
  fmtCtx,
  fmtMs,
} from "./shared";
import type { ModelData } from "./shared";

interface ModelGridProps {
  sortedModels: ModelData[];
  availableCount: number;
  cooldownCount: number;
  unknownCount: number;
  loading: boolean;
}

export function ModelGrid({ sortedModels, availableCount, cooldownCount, unknownCount, loading }: ModelGridProps) {
  return (
    <section id="all-models" className="animate-fade-in-up stagger-3">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </span>
          โมเดลทั้งหมด
        </h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400"><GlowDot status="available" /> พร้อม ({availableCount})</span>
          <span className="flex items-center gap-1.5 text-amber-400"><GlowDot status="cooldown" /> พัก ({cooldownCount})</span>
          <span className="flex items-center gap-1.5 text-gray-500"><GlowDot status="unknown" /> ไม่ทราบ ({unknownCount})</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : sortedModels.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <p>ยังไม่มีโมเดล — กด &quot;รันตอนนี้&quot; เพื่อสแกน</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedModels.map((model) => {
            const pc = PROVIDER_COLORS[model.provider] ?? PROVIDER_COLORS.openrouter;
            const cooldownText = fmtCooldown(model.health.cooldownUntil);
            return (
              <div
                key={model.id}
                className={`card-3d glass rounded-xl p-4 cursor-default ${
                  model.health.status === "available" ? "border border-emerald-500/20 hover:border-emerald-400/40" :
                  model.health.status === "cooldown"  ? "border border-amber-500/20 hover:border-amber-400/40" :
                  "border border-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GlowDot status={model.health.status} />
                    <span className="font-medium text-sm text-gray-100 truncate leading-tight">{model.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${TIER_COLORS[model.tier] ?? TIER_COLORS.small}`}>
                      {TIER_LABELS[model.tier] ?? "S"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${pc.text} ${pc.bg} border ${pc.border}`}>
                    {model.provider}
                  </span>
                  <span className="text-xs text-gray-600">{fmtCtx(model.contextLength)}</span>
                </div>

                {model.benchmark ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{model.benchmark.avgScore.toFixed(1)}/{model.benchmark.maxScore}</span>
                      <span className="text-xs font-bold text-indigo-300">
                        {Math.round((model.benchmark.avgScore / model.benchmark.maxScore) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(model.benchmark.avgScore / model.benchmark.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-700 italic">ยังไม่มีคะแนน</div>
                )}

                {cooldownText && (
                  <div className="mt-2 text-xs text-amber-400 bg-amber-500/10 rounded px-2 py-1">
                    ⏱ {cooldownText}
                  </div>
                )}
                {model.health.latencyMs > 0 && (
                  <div className="mt-1 text-xs text-gray-600">{fmtMs(model.health.latencyMs)}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
