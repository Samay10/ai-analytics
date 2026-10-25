"use client";

import { useMemo } from "react";
import { CATEGORIES } from "@/lib/metrics";
import { orgOf } from "@/lib/orgs";
import { type OpenFilter, useStore } from "@/lib/store";

const OPEN_OPTIONS: { id: OpenFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open weights" },
  { id: "closed", label: "Closed" },
];

export function Controls() {
  const weights = useStore((s) => s.weights);
  const setWeight = useStore((s) => s.setWeight);
  const resetWeights = useStore((s) => s.resetWeights);
  const openFilter = useStore((s) => s.openFilter);
  const setOpenFilter = useStore((s) => s.setOpenFilter);
  const hiddenOrgs = useStore((s) => s.hiddenOrgs);
  const toggleOrg = useStore((s) => s.toggleOrg);
  const models = useStore((s) => s.dataset.models);

  const orgs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of models) counts.set(m.org, (counts.get(m.org) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [models]);

  return (
    <div className="space-y-4 border-b border-line px-4 py-3">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-dim">Category weights</span>
          <button onClick={resetWeights} className="text-[10px] text-dim hover:text-white">
            Reset
          </button>
        </div>
        {CATEGORIES.map((c) => (
          <label key={c.id} className="flex items-center gap-3 py-0.5 text-xs">
            <span className="size-1.5 rounded-full" style={{ background: c.color }} />
            <span className="w-20 text-white/80">{c.label}</span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.25}
              value={weights[c.id]}
              onChange={(e) => setWeight(c.id, Number(e.target.value))}
              className="h-1 flex-1"
            />
            <span className="w-7 text-right font-mono text-[10px] text-dim">{weights[c.id].toFixed(2)}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-1 rounded-lg bg-white/5 p-0.5">
        {OPEN_OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOpenFilter(o.id)}
            className={`flex-1 rounded-md py-1 text-[11px] transition ${openFilter === o.id ? "bg-white/15 text-white" : "text-dim hover:text-white"}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {orgs.map((id) => {
          const org = orgOf(id);
          const hidden = hiddenOrgs.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggleOrg(id)}
              className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] transition ${
                hidden ? "border-line text-white/30" : "border-white/15 text-white/85"
              }`}
            >
              <span className="size-1.5 rounded-full" style={{ background: hidden ? "#444" : org.color }} />
              {org.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
