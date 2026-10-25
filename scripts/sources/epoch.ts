import { unzipSync, strFromU8 } from "fflate";
import Papa from "papaparse";
import type { SourceRecord } from "../../lib/types";
import { fetchWithRetry, maxInto } from "./http";

type Row = Record<string, string>;

const UNRELEASED = /pre-?release|checkpoint|internal/i;

const BENCHMARKS: { file: string; metric: string; column: string[] }[] = [
  { file: "gpqa_diamond.csv", metric: "epoch.gpqa", column: ["mean_score"] },
  { file: "hle_external.csv", metric: "epoch.hle", column: ["Accuracy"] },
  { file: "frontiermath.csv", metric: "epoch.frontiermath", column: ["mean_score"] },
  { file: "otis_mock_aime_2024_2025.csv", metric: "epoch.aime", column: ["mean_score"] },
  { file: "swe_bench_verified.csv", metric: "epoch.swe", column: ["mean_score"] },
  { file: "terminalbench_external.csv", metric: "epoch.terminal", column: ["Accuracy mean"] },
];

function parse(files: Record<string, Uint8Array>, name: string): Row[] {
  const path = Object.keys(files).find((p) => p === name || p.endsWith(`/${name}`));
  if (!path) throw new Error(`Epoch archive missing ${name}`);
  return Papa.parse<Row>(strFromU8(files[path]), { header: true, skipEmptyLines: true }).data;
}

export async function fetchEpoch(): Promise<SourceRecord[]> {
  const res = await fetchWithRetry("https://epoch.ai/data/benchmark_data.zip");
  const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
  const records: SourceRecord[] = [];

  for (const row of parse(files, "eci_scores.csv")) {
    const eci = Number(row.eci);
    if (!row.Model || !Number.isFinite(eci)) continue;
    records.push({
      source: "epoch",
      name: row["Display name"] || row.Model,
      org: row.Organization,
      releaseDate: row.date || undefined,
      openWeights: row["Accessibility group"]
        ? /open/i.test(row["Accessibility group"])
        : undefined,
      metrics: { "epoch.eci": eci },
    });
  }

  for (const bench of BENCHMARKS) {
    const byModel = new Map<string, SourceRecord>();
    for (const row of parse(files, bench.file)) {
      const name = row["Model version"];
      if (!name || UNRELEASED.test(name)) continue;
      const rec = byModel.get(name) ?? {
        source: "epoch" as const,
        name,
        org: row.Organization,
        releaseDate: row["Release date"] || undefined,
        metrics: {},
      };
      for (const col of bench.column) maxInto(rec.metrics, bench.metric, Number(row[col]) * 100);
      byModel.set(name, rec);
    }
    records.push(...byModel.values());
  }
  return records;
}
