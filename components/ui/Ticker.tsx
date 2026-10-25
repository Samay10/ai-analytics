"use client";

import { timeAgo } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import type { FeedEvent } from "@/lib/types";

const ICON: Record<FeedEvent["type"], { glyph: string; cls: string }> = {
  release: { glyph: "✦", cls: "text-sky-300" },
  rank_up: { glyph: "▲", cls: "text-emerald-400" },
  rank_down: { glyph: "▼", cls: "text-rose-400" },
  new_leader: { glyph: "★", cls: "text-amber-300" },
};

export function Ticker() {
  const events = useStore((s) => s.dataset.events);
  const select = useStore((s) => s.select);
  const now = useNow(60_000);
  if (!events.length) return null;

  const items = events.slice(0, 25);
  return (
    <div className="glass pointer-events-auto flex h-9 items-center overflow-hidden rounded-full">
      <span className="z-10 flex h-full shrink-0 items-center gap-2 border-r border-line bg-black/30 px-4 text-[10px] font-semibold uppercase tracking-widest">
        Feed
      </span>
      <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]">
        <div className="animate-marquee flex w-max">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex" aria-hidden={dup === 1}>
              {items.map((e) => (
                <button
                  key={e.id}
                  onClick={() => e.modelId && select(e.modelId)}
                  className="flex items-center gap-2 whitespace-nowrap px-5 text-xs text-white/80 hover:text-white"
                >
                  <span className={ICON[e.type].cls}>{ICON[e.type].glyph}</span>
                  {e.text}
                  <span className="font-mono text-[10px] text-dim">{timeAgo(e.date, now)}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
