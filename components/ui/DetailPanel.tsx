"use client";

import { AnimatePresence, motion } from "framer-motion";
import { blendedPrice, formatContext, formatPrice } from "@/lib/format";
import { useSelectedModel } from "@/lib/hooks";
import { CATEGORIES, METRICS } from "@/lib/metrics";
import { orgOf } from "@/lib/orgs";
import { useStore } from "@/lib/store";
import { Delta } from "./Delta";
import { Radar } from "./Radar";

const SOURCE_NAMES: Record<string, string> = {
  aa: "Artificial Analysis",
  arena: "LMArena",
  epoch: "Epoch AI",
  openrouter: "OpenRouter",
};

function formatMetric(v: number, unit: string) {
  return unit === "%" ? `${v.toFixed(1)}%` : unit === "elo" ? Math.round(v).toString() : v.toFixed(1);
}

export function DetailPanel() {
  const model = useSelectedModel();
  const select = useStore((s) => s.select);

  return (
    <AnimatePresence>
      {model && (
        <motion.aside
          key="detail"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="glass pointer-events-auto flex max-h-full w-full max-w-[340px] flex-col overflow-hidden rounded-2xl"
        >
          <div className="relative border-b border-line px-5 pb-4 pt-5">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{ background: `radial-gradient(circle at 20% 0%, ${orgOf(model.org).color}55, transparent 60%)` }}
            />
            <button
              onClick={() => select(null)}
              className="absolute right-3 top-3 grid size-7 place-items-center rounded-full text-dim hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
            <p className="relative text-[11px] uppercase tracking-widest" style={{ color: orgOf(model.org).color }}>
              {orgOf(model.org).label}
              {model.openWeights != null && (
                <span className="ml-2 text-dim">· {model.openWeights ? "Open weights" : "Closed"}</span>
              )}
            </p>
            <h2 className="relative mt-1 font-display text-2xl font-semibold leading-tight">{model.name}</h2>
            <div className="relative mt-3 flex items-end gap-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-dim">Rank</p>
                <p className="font-display text-3xl font-semibold">#{model.rank}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-dim">Score</p>
                <p className="font-display text-3xl font-semibold">{model.score.toFixed(1)}</p>
              </div>
              <div className="pb-1.5 text-xs text-dim">
                <div className="flex items-center gap-1">24h <Delta value={model.rankDelta1d} /></div>
                <div className="flex items-center gap-1">7d <Delta value={model.rankDelta7d} /></div>
              </div>
            </div>
            {model.provisional && (
              <p className="relative mt-3 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-[11px] text-amber-200/80">
                Provisional — benchmarked in only {Math.round(model.confidence * 100)}% of weighted categories.
              </p>
            )}
          </div>

          <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-5 py-4">
            <div className="flex justify-center">
              <Radar values={model.categories} color={orgOf(model.org).color} size={230} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Released", model.releaseDate ?? "—"],
                ["Price / 1M", formatPrice(blendedPrice(model.pricing))],
                ["Context", formatContext(model.contextLength)],
                ["Speed", model.speed ? `${Math.round(model.speed)} tok/s` : "—"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-dim">{k}</p>
                  <p className="mt-0.5 font-mono text-sm">{v}</p>
                </div>
              ))}
            </div>

            {CATEGORIES.map((cat) => {
              const rows = METRICS.filter((d) => d.category === cat.id && model.metrics[d.id] != null);
              if (!rows.length) return null;
              return (
                <div key={cat.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-dim">
                      <span className="size-1.5 rounded-full" style={{ background: cat.color }} />
                      {cat.label}
                    </span>
                    <span className="font-mono text-[11px]">{model.categories[cat.id]?.toFixed(0)}</span>
                  </div>
                  {rows.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 py-0.5 text-xs">
                      <span className="flex-1 truncate text-white/70">{d.label}</span>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${model.normalized[d.id] ?? 0}%`, background: cat.color }}
                        />
                      </div>
                      <span className="w-14 text-right font-mono text-[11px]">
                        {formatMetric(model.metrics[d.id], d.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}

            <p className="text-[10px] leading-relaxed text-dim">
              Sources: {model.sources.map((s) => SOURCE_NAMES[s]).join(", ")}. Bars show position between the
              weakest and strongest model on each benchmark.
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
