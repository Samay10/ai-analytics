export function Delta({ value }: { value: number | null }) {
  if (!value) return <span className="w-6 text-right font-mono text-[10px] text-white/20">–</span>;
  const up = value > 0;
  return (
    <span className={`w-6 text-right font-mono text-[10px] ${up ? "text-emerald-400" : "text-rose-400"}`}>
      {up ? "▲" : "▼"}
      {Math.abs(value)}
    </span>
  );
}
