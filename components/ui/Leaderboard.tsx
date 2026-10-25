"use client";

import { LayoutGroup, motion } from "framer-motion";
import { useState } from "react";
import { useRanked } from "@/lib/hooks";
import { orgOf } from "@/lib/orgs";
import { useStore } from "@/lib/store";
import { Controls } from "./Controls";
import { Delta } from "./Delta";

export function Leaderboard() {
  const ranked = useRanked();
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const hover = useStore((s) => s.hover);
  const [tuning, setTuning] = useState(false);
  const top = ranked[0]?.score ?? 100;

  return (
    <aside className="glass pointer-events-auto flex max-h-full w-80 flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold">Leaderboard</h2>
          <p className="text-[11px] text-dim">{ranked.length} models · composite score</p>
        </div>
        <button
          onClick={() => setTuning((t) => !t)}
          className={`rounded-full px-3 py-1 text-[11px] transition ${tuning ? "bg-accent text-black" : "bg-white/5 text-dim hover:text-white"}`}
        >
          Tune ranking
        </button>
      </div>

      {tuning && <Controls />}

      <LayoutGroup>
        <ol className="scrollbar-thin flex-1 overflow-y-auto p-2">
          {ranked.map((m) => (
            <motion.li
              layout="position"
              key={m.id}
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
              onMouseEnter={() => hover(m.id)}
              onMouseLeave={() => hover(null)}
              onClick={() => select(m.id === selectedId ? null : m.id)}
              className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition ${
                m.id === selectedId ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span className="w-6 text-right font-mono text-[11px] text-dim">{m.rank}</span>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ background: orgOf(m.org).color, boxShadow: `0 0 8px ${orgOf(m.org).color}` }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="truncate text-[13px]">{m.name}</span>
                  {m.provisional && (
                    <span title="Benchmarked in few categories" className="text-[9px] text-amber-300/70">
                      ◐
                    </span>
                  )}
                </div>
                <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${(m.score / top) * 100}%`, background: orgOf(m.org).color }}
                  />
                </div>
              </div>
              <span className="font-mono text-xs tabular-nums">{m.score.toFixed(1)}</span>
              <Delta value={m.rankDelta1d} />
            </motion.li>
          ))}
        </ol>
      </LayoutGroup>
    </aside>
  );
}
