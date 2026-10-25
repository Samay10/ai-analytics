import { z } from "zod";
import type { SourceRecord } from "../../lib/types";
import { fetchJson } from "./http";

const Schema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      created: z.number().optional(),
      context_length: z.number().nullish(),
      pricing: z.object({ prompt: z.string(), completion: z.string() }).partial().optional(),
    }),
  ),
});

export async function fetchOpenRouter(): Promise<SourceRecord[]> {
  const { data } = Schema.parse(await fetchJson("https://openrouter.ai/api/v1/models"));
  return data
    .filter((m) => !m.id.endsWith(":free") && !m.id.startsWith("openrouter/"))
    .map((m) => {
      const input = Number(m.pricing?.prompt) * 1e6;
      const output = Number(m.pricing?.completion) * 1e6;
      return {
        source: "openrouter",
        name: m.name,
        org: m.id.split("/")[0],
        openrouterId: m.id,
        releaseDate: m.created ? new Date(m.created * 1000).toISOString().slice(0, 10) : undefined,
        contextLength: m.context_length ?? undefined,
        pricing: input >= 0 && output >= 0 ? { input, output } : undefined,
        metrics: {},
      };
    });
}
