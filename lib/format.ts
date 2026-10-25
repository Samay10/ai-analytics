export function blendedPrice(p: { input: number; output: number } | null): number | null {
  return p ? (3 * p.input + p.output) / 4 : null;
}

export function formatPrice(n: number | null): string {
  if (n == null) return "—";
  if (n === 0) return "Free";
  return n < 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(n < 10 ? 2 : 0)}`;
}

export function formatContext(n: number | null): string {
  if (!n) return "—";
  return n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : `${Math.round(n / 1000)}K`;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  return d < 30 ? `${d}d ago` : new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function daysSince(date: string | null, now = Date.now()): number | null {
  return date ? (now - new Date(date).getTime()) / 86_400_000 : null;
}

/** Deterministic 0–1 value per string, used for stable orbital placement. */
export function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}
