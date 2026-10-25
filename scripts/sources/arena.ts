import { parquetReadObjects } from "hyparquet";
import { z } from "zod";
import type { SourceRecord } from "../../lib/types";
import { fetchJson, fetchWithRetry, maxInto } from "./http";

const Row = z.object({
  model_name: z.string(),
  organization: z.string().nullish(),
  license: z.string().nullish(),
  rating: z.number(),
  category: z.string(),
});

const BOARDS: { config: string; metric: string }[] = [
  { config: "text", metric: "arena.text" },
  { config: "webdev", metric: "arena.webdev" },
];

const DATASET = "https://huggingface.co/api/datasets/lmarena-ai/leaderboard-dataset/parquet";

async function fetchBoard(config: string) {
  const urls = z.array(z.string()).parse(await fetchJson(`${DATASET}/${config}/latest`));
  const rows: z.infer<typeof Row>[] = [];
  for (const url of urls) {
    const file = await (await fetchWithRetry(url)).arrayBuffer();
    const objects = await parquetReadObjects({
      file,
      columns: ["model_name", "organization", "license", "rating", "category"],
    });
    for (const obj of objects) {
      const row = Row.safeParse(obj);
      if (row.success && row.data.category === "overall") rows.push(row.data);
    }
  }
  return rows;
}

export async function fetchArena(): Promise<SourceRecord[]> {
  const byName = new Map<string, SourceRecord>();
  for (const board of BOARDS) {
    for (const row of await fetchBoard(board.config)) {
      const rec =
        byName.get(row.model_name) ??
        ({
          source: "arena",
          name: row.model_name,
          org: row.organization ?? undefined,
          openWeights: row.license ? !/proprietary/i.test(row.license) : undefined,
          metrics: {},
        } satisfies SourceRecord);
      maxInto(rec.metrics, board.metric, row.rating);
      byName.set(row.model_name, rec);
    }
  }
  return [...byName.values()];
}
