import { CATEGORIES } from "@/lib/metrics";
import type { CategoryId } from "@/lib/types";

export function Radar({
  values,
  color,
  size = 200,
}: {
  values: Partial<Record<CategoryId, number>>;
  color: string;
  size?: number;
}) {
  const c = size / 2;
  const r = c - 28;
  const n = CATEGORIES.length;
  const point = (i: number, v: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [c + Math.cos(a) * r * v, c + Math.sin(a) * r * v] as const;
  };
  const poly = CATEGORIES.map((cat, i) => point(i, (values[cat.id] ?? 0) / 100).join(",")).join(" ");

  return (
    <svg width={size} height={size} className="overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon
          key={s}
          points={CATEGORIES.map((_, i) => point(i, s).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
        />
      ))}
      {CATEGORIES.map((cat, i) => {
        const [x, y] = point(i, 1);
        const [lx, ly] = point(i, 1.22);
        const missing = values[cat.id] == null;
        return (
          <g key={cat.id}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`font-mono text-[9px] ${missing ? "fill-white/20" : "fill-white/60"}`}
            >
              {cat.label}
            </text>
          </g>
        );
      })}
      <polygon points={poly} fill={color} fillOpacity={0.2} stroke={color} strokeWidth={1.5} />
      {CATEGORIES.map((cat, i) => {
        const v = values[cat.id];
        if (v == null) return null;
        const [x, y] = point(i, v / 100);
        return <circle key={cat.id} cx={x} cy={y} r={2.5} fill={color} />;
      })}
    </svg>
  );
}
