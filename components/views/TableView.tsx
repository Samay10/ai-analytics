"use client";

import { blendedPrice, formatContext, formatPrice } from "@/lib/format";
import { useRanked } from "@/lib/hooks";
import { CATEGORIES } from "@/lib/metrics";
import { orgOf } from "@/lib/orgs";
import { useStore } from "@/lib/store";
import { Delta } from "../ui/Delta";

export default function TableView() {
  const ranked = useRanked();
  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);

  return (
    <div className="scrollbar-thin absolute inset-0 overflow-auto px-4 pb-24 pt-24 md:px-10">
      <table className="glass mx-auto w-full max-w-6xl overflow-hidden rounded-2xl text-left text-sm">
        <thead className="sticky top-0 bg-[#0b0d16]/95 text-[10px] uppercase tracking-widest text-dim">
          <tr>
            <th className="px-3 py-3 text-right">#</th>
            <th className="px-1 py-3" />
            <th className="px-3 py-3">Model</th>
            <th className="px-3 py-3 text-right">Score</th>
            {CATEGORIES.map((c) => (
              <th key={c.id} className="hidden px-2 py-3 text-right lg:table-cell">
                {c.label}
              </th>
            ))}
            <th className="hidden px-3 py-3 text-right md:table-cell">Price/1M</th>
            <th className="hidden px-3 py-3 text-right md:table-cell">Context</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((m) => (
            <tr
              key={m.id}
              onClick={() => select(m.id)}
              className={`cursor-pointer border-t border-line transition ${m.id === selectedId ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <td className="px-3 py-2 text-right font-mono text-xs text-dim">{m.rank}</td>
              <td className="px-1 py-2">
                <Delta value={m.rankDelta1d} />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: orgOf(m.org).color }} />
                  <span>{m.name}</span>
                  {m.provisional && <span className="text-[10px] text-amber-300/70">provisional</span>}
                </div>
                <div className="pl-4 text-[11px] text-dim">{orgOf(m.org).label}</div>
              </td>
              <td className="px-3 py-2 text-right font-mono">{m.score.toFixed(1)}</td>
              {CATEGORIES.map((c) => (
                <td key={c.id} className="hidden px-2 py-2 text-right font-mono text-xs text-white/70 lg:table-cell">
                  {m.categories[c.id]?.toFixed(0) ?? <span className="text-white/20">—</span>}
                </td>
              ))}
              <td className="hidden px-3 py-2 text-right font-mono text-xs md:table-cell">
                {formatPrice(blendedPrice(m.pricing))}
              </td>
              <td className="hidden px-3 py-2 text-right font-mono text-xs md:table-cell">
                {formatContext(m.contextLength)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
