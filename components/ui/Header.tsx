"use client";

import { timeAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";

const SOURCE_LABEL = {
  aa: "Artificial Analysis",
  arena: "LMArena",
  epoch: "Epoch AI",
  openrouter: "OpenRouter",
} as const;

export function Header() {
  const dataset = useStore((s) => s.dataset);
  const setSearchOpen = useStore((s) => s.setSearchOpen);
  const now = useNow();

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-4 px-5 pt-4">
      <div className="flex items-center gap-3">
        <div className="relative grid size-8 place-items-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500 opacity-70 blur-md" />
          <div className="relative size-3 rounded-full bg-white shadow-[0_0_20px_white]" />
        </div>
        <div>
          <h1 className="font-display text-lg font-semibold leading-none tracking-tight">Orbital</h1>
          <p className="mt-1 hidden text-[11px] text-dim sm:block">Live AI model rankings from published benchmarks</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSearchOpen(true)}
          className="glass hidden items-center gap-3 rounded-full px-3.5 py-1.5 text-xs text-dim transition hover:text-white sm:flex"
        >
          Search models
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
        <div className="glass group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-medium">Live</span>
          <span className="hidden text-dim sm:inline">· updated {timeAgo(dataset.generatedAt, now)}</span>
          <div className="glass invisible absolute right-0 top-full z-50 mt-2 w-60 rounded-xl p-3 opacity-0 transition group-hover:visible group-hover:opacity-100">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-dim">Sources</p>
            {dataset.sources.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${s.ok ? "bg-emerald-400" : s.cached ? "bg-amber-400" : "bg-white/20"}`}
                  />
                  {SOURCE_LABEL[s.id]}
                </span>
                <span className="font-mono text-[10px] text-dim">
                  {s.ok ? `${s.count}` : s.cached ? "cached" : "off"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
