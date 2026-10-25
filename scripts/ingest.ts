import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { canonicalKey, cleanName } from "../lib/match";
import { CATEGORIES, METRICS, METRIC_BY_ID } from "../lib/metrics";
import { orgOf, resolveOrg } from "../lib/orgs";
import { DEFAULT_WEIGHTS, rankModels } from "../lib/score";
import type {
  CategoryId,
  Dataset,
  FeedEvent,
  Model,
  SourceId,
  SourceRecord,
  SourceStatus,
} from "../lib/types";
import { fetchAA } from "./sources/aa";
import { fetchArena } from "./sources/arena";
import { fetchEpoch } from "./sources/epoch";
import { fetchOpenRouter } from "./sources/openrouter";

const ROOT = join(import.meta.dirname, "..");
const CACHE_DIR = join(ROOT, "data/cache");
const OUT_DIR = join(ROOT, "public/data");
const HISTORY_DIR = join(OUT_DIR, "history");

const RECENCY_MONTHS = 18;
const MAX_MODELS = 120;
const MIN_METRIC_COVERAGE = 3;
const RANK_EVENT_TOP = 25;
const MAX_EVENTS = 150;

const now = new Date();
const today = now.toISOString().slice(0, 10);

function readJson<T>(path: string): T | null {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as T) : null;
}

function writeJson(path: string, data: unknown, pretty = false) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, pretty ? 2 : undefined) + "\n");
}

async function loadSource(
  id: SourceId,
  fetcher: (() => Promise<SourceRecord[]>) | null,
): Promise<{ records: SourceRecord[]; status: SourceStatus }> {
  const cachePath = join(CACHE_DIR, `${id}.json`);
  if (fetcher) {
    try {
      const records = await fetcher();
      if (records.length === 0) throw new Error("empty response");
      writeJson(cachePath, records);
      console.log(`✓ ${id}: ${records.length} records`);
      return { records, status: { id, ok: true, count: records.length, cached: false } };
    } catch (err) {
      console.warn(`✗ ${id}: ${(err as Error).message} — falling back to cache`);
    }
  } else {
    console.log(`- ${id}: skipped (no credentials) — using cache if present`);
  }
  const records = readJson<SourceRecord[]>(cachePath) ?? [];
  return { records, status: { id, ok: false, count: records.length, cached: records.length > 0 } };
}

interface Merged {
  key: string;
  names: { name: string; priority: number }[];
  orgHints: string[];
  openWeights: boolean | null;
  dates: Partial<Record<SourceId, string>>;
  metrics: Record<string, number>;
  pricing: Partial<Record<SourceId, Model["pricing"]>>;
  contextLength: number | null;
  speed: number | null;
  openrouterId: string | null;
  sources: Set<SourceId>;
}

const NAME_PRIORITY: Record<SourceId, number> = { arena: 0, aa: 1, openrouter: 2, epoch: 3 };

function merge(records: SourceRecord[]): Map<string, Merged> {
  const merged = new Map<string, Merged>();
  const ordered = [...records].sort((a, b) =>
    a.source === "openrouter" ? 1 : b.source === "openrouter" ? -1 : 0,
  );
  for (const r of ordered) {
    const key = canonicalKey(r.openrouterId ?? r.name);
    let m = merged.get(key);
    if (!m && r.source === "openrouter") m = merged.get(canonicalKey(r.name));
    if (!m) {
      if (r.source === "openrouter") continue;
      m = {
        key,
        names: [],
        orgHints: [],
        openWeights: null,
        dates: {},
        metrics: {},
        pricing: {},
        contextLength: null,
        speed: null,
        openrouterId: null,
        sources: new Set(),
      };
      merged.set(key, m);
    }
    const isEciName = r.source === "epoch" && r.metrics["epoch.eci"] != null;
    m.names.push({ name: cleanName(r.name), priority: isEciName ? 0.5 : NAME_PRIORITY[r.source] });
    if (r.org) m.orgHints.push(r.org);
    if (r.openWeights != null) m.openWeights ??= r.openWeights;
    if (r.releaseDate) {
      const prev = m.dates[r.source];
      if (!prev || r.releaseDate < prev) m.dates[r.source] = r.releaseDate;
    }
    for (const [k, v] of Object.entries(r.metrics)) {
      if (m.metrics[k] == null || v > m.metrics[k]) m.metrics[k] = v;
    }
    if (r.pricing) m.pricing[r.source] ??= r.pricing;
    if (r.contextLength) m.contextLength = Math.max(m.contextLength ?? 0, r.contextLength);
    if (r.speed) m.speed ??= r.speed;
    if (r.openrouterId) m.openrouterId ??= r.openrouterId;
    m.sources.add(r.source);
  }
  return merged;
}

function releaseDate(m: Merged): string | null {
  return m.dates.epoch ?? m.dates.aa ?? m.dates.openrouter ?? null;
}

function buildModels(merged: Map<string, Merged>): Model[] {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - RECENCY_MONTHS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const pool = [...merged.values()].filter((m) => {
    const metricCount = Object.keys(m.metrics).filter((k) => METRIC_BY_ID.has(k)).length;
    if (metricCount === 0) return false;
    const date = releaseDate(m);
    return date ? date >= cutoffStr : metricCount >= 3;
  });

  const ranges = new Map<string, [number, number]>();
  for (const def of METRICS) {
    const values = pool.map((m) => m.metrics[def.id]).filter((v) => v != null);
    if (values.length < MIN_METRIC_COVERAGE) continue;
    ranges.set(def.id, [Math.min(...values), Math.max(...values)]);
  }

  const models = pool.map((m): Model => {
    const normalized: Record<string, number> = {};
    for (const [id, [lo, hi]] of ranges) {
      const v = m.metrics[id];
      if (v == null) continue;
      normalized[id] = hi === lo ? 100 : ((v - lo) / (hi - lo)) * 100;
    }
    const categories: Partial<Record<CategoryId, number>> = {};
    for (const { id: cat } of CATEGORIES) {
      const vals = METRICS.filter((d) => d.category === cat && normalized[d.id] != null).map(
        (d) => normalized[d.id],
      );
      if (vals.length) categories[cat] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    const name = [...m.names].sort((a, b) => a.priority - b.priority)[0].name;
    return {
      id: m.key,
      name,
      org: resolveOrg(...m.orgHints, name),
      openWeights: m.openWeights,
      releaseDate: releaseDate(m),
      metrics: Object.fromEntries(Object.entries(m.metrics).filter(([k]) => METRIC_BY_ID.has(k))),
      normalized,
      categories,
      score: 0,
      rank: 0,
      confidence: 0,
      provisional: false,
      pricing: m.pricing.aa ?? m.pricing.openrouter ?? null,
      contextLength: m.contextLength,
      speed: m.speed,
      openrouterId: m.openrouterId,
      sources: [...m.sources].sort(),
      rankDelta1d: null,
      rankDelta7d: null,
    };
  });

  return rankModels(models, DEFAULT_WEIGHTS).slice(0, MAX_MODELS);
}

interface Snapshot {
  date: string;
  ranks: Record<string, number>;
  scores: Record<string, number>;
}

function snapshotBefore(daysAgo: number): Snapshot | null {
  if (!existsSync(HISTORY_DIR)) return null;
  const limit = new Date(now);
  limit.setDate(limit.getDate() - daysAgo);
  const limitStr = limit.toISOString().slice(0, 10);
  const file = readdirSync(HISTORY_DIR)
    .filter((f) => f.endsWith(".json") && f.slice(0, 10) <= limitStr)
    .sort()
    .at(-1);
  return file ? readJson<Snapshot>(join(HISTORY_DIR, file)) : null;
}

function applyDeltas(models: Model[]) {
  const d1 = snapshotBefore(1);
  const d7 = snapshotBefore(7);
  for (const m of models) {
    const r1 = d1?.ranks[m.id];
    const r7 = d7?.ranks[m.id];
    m.rankDelta1d = r1 != null ? r1 - m.rank : null;
    m.rankDelta7d = r7 != null ? r7 - m.rank : null;
  }
}

function buildEvents(models: Model[], previous: Dataset | null, openrouter: SourceRecord[]) {
  const existing = readJson<FeedEvent[]>(join(OUT_DIR, "events.json")) ?? [];
  const seen = new Set(existing.map((e) => e.id));
  const fresh: FeedEvent[] = [];
  const push = (e: FeedEvent) => {
    if (!seen.has(e.id)) {
      seen.add(e.id);
      fresh.push(e);
    }
  };

  const recent = new Date(now);
  recent.setDate(recent.getDate() - 30);
  const recentStr = recent.toISOString().slice(0, 10);
  const ranked = new Set(models.map((m) => m.openrouterId).filter(Boolean));

  for (const m of models) {
    if (m.releaseDate && m.releaseDate >= recentStr) {
      push({
        id: `release:${m.id}`,
        date: m.releaseDate,
        type: "release",
        modelId: m.id,
        text: `${orgOf(m.org).label} released ${m.name} — debuts at #${m.rank}`,
      });
    }
  }
  for (const r of openrouter) {
    if (r.releaseDate && r.releaseDate >= recentStr && !ranked.has(r.openrouterId ?? "")) {
      push({
        id: `release:or:${r.openrouterId}`,
        date: r.releaseDate,
        type: "release",
        modelId: null,
        text: `${cleanName(r.name)} is now available — awaiting benchmarks`,
      });
    }
  }

  if (previous) {
    const prevRank = new Map(previous.models.map((m) => [m.id, m.rank]));
    const stamp = now.toISOString();
    const prevLeader = previous.models.find((m) => m.rank === 1);
    if (prevLeader && models[0] && prevLeader.id !== models[0].id) {
      push({
        id: `leader:${models[0].id}:${stamp}`,
        date: stamp,
        type: "new_leader",
        modelId: models[0].id,
        text: `${models[0].name} takes #1, overtaking ${prevLeader.name}`,
      });
    }
    for (const m of models.slice(0, RANK_EVENT_TOP)) {
      const before = prevRank.get(m.id);
      if (before == null || before === m.rank || m.rank === 1) continue;
      const up = before > m.rank;
      push({
        id: `rank:${m.id}:${before}->${m.rank}:${today}`,
        date: stamp,
        type: up ? "rank_up" : "rank_down",
        modelId: m.id,
        text: `${m.name} ${up ? "climbs" : "drops"} #${before} → #${m.rank}`,
      });
    }
  }

  return [...fresh, ...existing].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_EVENTS);
}

async function main() {
  const aaKey = process.env.AA_API_KEY;
  const results = await Promise.all([
    loadSource("epoch", fetchEpoch),
    loadSource("arena", fetchArena),
    loadSource("aa", aaKey ? () => fetchAA(aaKey) : null),
    loadSource("openrouter", fetchOpenRouter),
  ]);
  const all = results.flatMap((r) => r.records);
  const openrouter = results[3].records;

  const models = buildModels(merge(all));
  if (models.length < 10) throw new Error(`Only ${models.length} models built; refusing to publish`);
  applyDeltas(models);

  const previous = readJson<Dataset>(join(OUT_DIR, "latest.json"));
  const events = buildEvents(models, previous, openrouter);

  const dataset: Dataset = {
    generatedAt: now.toISOString(),
    sources: results.map((r) => r.status),
    metrics: METRICS,
    models,
    events: events.slice(0, 50),
  };

  writeJson(join(OUT_DIR, "latest.json"), dataset);
  writeJson(join(OUT_DIR, "events.json"), events);
  writeJson(join(HISTORY_DIR, `${today}.json`), {
    date: today,
    ranks: Object.fromEntries(models.map((m) => [m.id, m.rank])),
    scores: Object.fromEntries(models.map((m) => [m.id, Math.round(m.score * 10) / 10])),
  } satisfies Snapshot);

  console.log(`\nPublished ${models.length} models. Top 10:`);
  for (const m of models.slice(0, 10)) {
    console.log(
      `  #${String(m.rank).padStart(2)} ${m.name.padEnd(32)} ${m.score.toFixed(1).padStart(5)}  ` +
        `conf ${(m.confidence * 100).toFixed(0)}%  [${m.sources.join(",")}]`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
