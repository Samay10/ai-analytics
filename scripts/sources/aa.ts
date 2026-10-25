import { z } from "zod";
import type { SourceRecord } from "../../lib/types";
import { fetchJson, maxInto } from "./http";

const num = z.number().nullish();
const Schema = z.object({
  data: z.array(
    z.object({
      name: z.string(),
      slug: z.string().optional(),
      release_date: z.string().nullish(),
      model_creator: z.object({ name: z.string() }).partial().nullish(),
      evaluations: z.record(z.string(), num).nullish(),
      pricing: z
        .object({ price_1m_input_tokens: num, price_1m_output_tokens: num })
        .partial()
        .nullish(),
      median_output_tokens_per_second: num,
    }),
  ),
});

/** AA evaluation key → our metric id, and whether AA reports it as a 0–1 fraction. */
const EVALS: Record<string, [metric: string, fraction: boolean]> = {
  artificial_analysis_intelligence_index: ["aa.intelligence", false],
  artificial_analysis_coding_index: ["aa.coding_index", false],
  artificial_analysis_math_index: ["aa.math_index", false],
  mmlu_pro: ["aa.mmlu_pro", true],
  gpqa: ["aa.gpqa", true],
  hle: ["aa.hle", true],
  livecodebench: ["aa.livecodebench", true],
  scicode: ["aa.scicode", true],
  terminalbench_hard: ["aa.terminalbench_hard", true],
  tau2: ["aa.tau2", true],
};

export async function fetchAA(apiKey: string): Promise<SourceRecord[]> {
  const raw = await fetchJson("https://artificialanalysis.ai/api/v2/data/llms/models", {
    headers: { "x-api-key": apiKey },
  });
  return Schema.parse(raw).data.map((m) => {
    const metrics: Record<string, number> = {};
    for (const [key, [metric, fraction]] of Object.entries(EVALS)) {
      const v = m.evaluations?.[key];
      if (v != null) maxInto(metrics, metric, fraction && v <= 1 ? v * 100 : v);
    }
    const input = m.pricing?.price_1m_input_tokens;
    const output = m.pricing?.price_1m_output_tokens;
    return {
      source: "aa",
      name: m.name,
      org: m.model_creator?.name,
      releaseDate: m.release_date ?? undefined,
      metrics,
      pricing: input != null && output != null ? { input, output } : undefined,
      speed: m.median_output_tokens_per_second ?? undefined,
    };
  });
}
