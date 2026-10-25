"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { blendedPrice, formatPrice } from "@/lib/format";
import { useRanked } from "@/lib/hooks";
import { orgOf } from "@/lib/orgs";
import { useStore } from "@/lib/store";

const W = 900;
const H = 560;
const PAD = { l: 56, r: 24, t: 24, b: 44 };

export default function ValueView() {
  const ranked = useRanked();
  const select = useStore((s) => s.select);
  const selectedId = useStore((s) => s.selectedId);
  const [hover, setHover] = useState<string | null>(null);

  const { points, frontier, xTicks, yMin } = useMemo(() => {
    const pts = ranked
      .map((m) => ({ m, price: blendedPrice(m.pricing) }))
      .filter((p): p is { m: typeof p.m; price: number } => p.price != null && p.price > 0);
    const prices = pts.map((p) => p.price);
    const lo = Math.log10(Math.min(...prices, 0.1));
    const hi = Math.log10(Math.max(...prices, 10));
    const yMin = Math.floor(Math.min(...pts.map((p) => p.m.score), 50) / 10) * 10;
    const sx = (p: number) => PAD.l + ((Math.log10(p) - lo) / (hi - lo)) * (W - PAD.l - PAD.r);
    const sy = (s: number) => PAD.t + (1 - (s - yMin) / (100 - yMin)) * (H - PAD.t - PAD.b);

    const sorted = [...pts].sort((a, b) => a.price - b.price);
    const front: typeof pts = [];
    for (const p of sorted) if (!front.length || p.m.score > front[front.length - 1].m.score) front.push(p);

    const ticks: number[] = [];
    for (let e = Math.floor(lo); e <= Math.ceil(hi); e++) ticks.push(10 ** e);

    return {
      points: pts.map((p) => ({ ...p, x: sx(p.price), y: sy(p.m.score), onFrontier: front.includes(p) })),
      frontier: front.map((p) => `${sx(p.price)},${sy(p.m.score)}`).join(" "),
      xTicks: ticks.filter((t) => Math.log10(t) >= lo && Math.log10(t) <= hi).map((t) => ({ t, x: sx(t) })),
      yMin,
    };
  }, [ranked]);

  const sy = (s: number) => PAD.t + (1 - (s - yMin) / (100 - yMin)) * (H - PAD.t - PAD.b);
  const active = points.find((p) => p.m.id === (hover ?? selectedId));

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,#0d1022_0%,#05060a_70%)] px-[360px] pb-20 pt-24">
      <div className="relative h-full w-full max-w-5xl">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full overflow-visible">
          <defs>
            <linearGradient id="front" x1="0" x2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#8b9dff" />
            </linearGradient>
          </defs>
          {xTicks.map(({ t, x }) => (
            <g key={t}>
              <line x1={x} x2={x} y1={PAD.t} y2={H - PAD.b} stroke="rgba(255,255,255,0.05)" />
              <text x={x} y={H - PAD.b + 18} textAnchor="middle" className="fill-white/40 font-mono text-[10px]">
                {formatPrice(t)}
              </text>
            </g>
          ))}
          {Array.from({ length: (100 - yMin) / 10 + 1 }, (_, i) => yMin + i * 10).map((s) => (
            <g key={s}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(s)} y2={sy(s)} stroke="rgba(255,255,255,0.05)" />
              <text x={PAD.l - 10} y={sy(s)} textAnchor="end" dominantBaseline="middle" className="fill-white/40 font-mono text-[10px]">
                {s}
              </text>
            </g>
          ))}
          <text x={W / 2} y={H - 4} textAnchor="middle" className="fill-white/50 text-[11px]">
            Blended price per 1M tokens (log scale) →
          </text>
          <text x={14} y={H / 2} textAnchor="middle" transform={`rotate(-90 14 ${H / 2})`} className="fill-white/50 text-[11px]">
            Composite score →
          </text>

          <motion.polyline
            points={frontier}
            fill="none"
            stroke="url(#front)"
            strokeWidth={2}
            strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
          />

          {points.map((p) => {
            const color = orgOf(p.m.org).color;
            const isActive = active?.m.id === p.m.id;
            return (
              <motion.circle
                key={p.m.id}
                initial={false}
                animate={{ cx: p.x, cy: p.y, r: isActive ? 8 : p.onFrontier ? 6 : 4 }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                fill={color}
                fillOpacity={p.onFrontier || isActive ? 1 : 0.55}
                stroke={isActive ? "#fff" : "none"}
                style={{ filter: p.onFrontier ? `drop-shadow(0 0 6px ${color})` : undefined, cursor: "pointer" }}
                onMouseEnter={() => setHover(p.m.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => select(p.m.id)}
              />
            );
          })}
          {points
            .filter((p) => p.onFrontier)
            .map((p) => (
              <text key={p.m.id} x={p.x + 9} y={p.y - 8} className="pointer-events-none fill-white/75 text-[10px]">
                {p.m.name}
              </text>
            ))}
        </svg>
        {active && (
          <div
            className="glass pointer-events-none absolute rounded-lg px-3 py-2 text-xs"
            style={{ left: `${(active.x / W) * 100}%`, top: `${(active.y / H) * 100}%`, transform: "translate(14px, -110%)" }}
          >
            <div className="font-medium">{active.m.name}</div>
            <div className="text-dim">
              #{active.m.rank} · score <span className="font-mono text-white">{active.m.score.toFixed(1)}</span> ·{" "}
              <span className="font-mono text-white">{formatPrice(active.price)}</span>/1M
            </div>
          </div>
        )}
        <p className="absolute right-0 top-0 text-[11px] text-dim">
          <span className="text-emerald-300">- - -</span> Value frontier: no model is both cheaper and better
        </p>
      </div>
    </div>
  );
}
