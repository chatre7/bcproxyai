"use client";

import { useCallback, useEffect, useState } from "react";
import { ProviderBadge } from "./shared";

interface ProviderLimit {
  provider: string;
  modelId: string;
  limitTpm: number | null;
  limitTpd: number | null;
  remainingTpm: number | null;
  remainingTpd: number | null;
  resetTpmAt: string | null;
  resetTpdAt: string | null;
  source: string;
  lastUpdated: number;
}

interface LimitsResponse {
  limits: ProviderLimit[];
}

function formatNum(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function pctColor(remaining: number | null, limit: number | null): string {
  if (remaining == null || limit == null || limit === 0) return "bg-gray-600";
  const pct = (remaining / limit) * 100;
  if (pct < 20) return "bg-red-500";
  if (pct < 50) return "bg-amber-500";
  return "bg-emerald-500";
}

function pctWidth(remaining: number | null, limit: number | null): string {
  if (remaining == null || limit == null || limit === 0) return "0%";
  const pct = Math.min(100, Math.max(0, (remaining / limit) * 100));
  return pct.toFixed(0) + "%";
}

function formatSource(source: string): string {
  const map: Record<string, string> = {
    header: "📡 Header",
    "error-tpd": "⚠️ 429 TPD",
    "error-tpm": "⚠️ 429 TPM",
    "error-unknown": "⚠️ 429",
    "error-generic": "⚠️ 429",
    unknown: "—",
  };
  return map[source] ?? source;
}

export function ProviderLimitsPanel() {
  const [limits, setLimits] = useState<ProviderLimit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLimits = useCallback(async () => {
    try {
      const res = await fetch("/api/provider-limits");
      if (res.ok) {
        const data: LimitsResponse = await res.json();
        setLimits(data.limits ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
    const interval = setInterval(fetchLimits, 5_000);
    return () => clearInterval(interval);
  }, [fetchLimits]);

  const sorted = [...limits].sort((a, b) => {
    const ar = a.remainingTpm ?? a.remainingTpd ?? Infinity;
    const br = b.remainingTpm ?? b.remainingTpd ?? Infinity;
    return br - ar;
  });

  return (
    <div className="glass rounded-2xl p-4 border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-base">
            📊
          </span>
          โควต้า Provider (TPM/TPD)
        </h2>
        <span className="text-xs text-gray-500">
          {limits.length} models • อัพเดททุก 5 วินาที
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">กำลังโหลด…</div>
      ) : limits.length === 0 ? (
        <div className="text-sm text-gray-500 py-4 text-center">
          ยังไม่มีข้อมูล limits — ระบบจะเรียนรู้จาก response headers + 429 errors อัตโนมัติ
        </div>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
          {sorted.map((l, i) => (
            <div
              key={`${l.provider}-${l.modelId}-${i}`}
              className="rounded-lg bg-gray-900/40 p-3 border border-gray-800/60"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ProviderBadge provider={l.provider} />
                  <span className="text-xs text-gray-300 truncate font-mono">
                    {l.modelId}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                  {formatSource(l.source)}
                </span>
              </div>

              {l.limitTpm != null && (
                <div className="mb-1">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                    <span>TPM</span>
                    <span className="font-mono">
                      {formatNum(l.remainingTpm)} / {formatNum(l.limitTpm)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${pctColor(l.remainingTpm, l.limitTpm)} transition-all`}
                      style={{ width: pctWidth(l.remainingTpm, l.limitTpm) }}
                    />
                  </div>
                </div>
              )}

              {l.limitTpd != null && (
                <div className="mt-1">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                    <span>TPD</span>
                    <span className="font-mono">
                      {formatNum(l.remainingTpd)} / {formatNum(l.limitTpd)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded overflow-hidden">
                    <div
                      className={`h-full ${pctColor(l.remainingTpd, l.limitTpd)} transition-all`}
                      style={{ width: pctWidth(l.remainingTpd, l.limitTpd) }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
