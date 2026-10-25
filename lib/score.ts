import { CATEGORIES } from "./metrics";
import type { CategoryId, Model, Weights } from "./types";

export const DEFAULT_WEIGHTS: Weights = {
  general: 1,
  reasoning: 1,
  coding: 1,
  math: 1,
  agentic: 1,
  preference: 1,
};

/** Missing categories are filled by a prior so thinly-benchmarked models can't top the board. */
const PRIOR_SCORE = 50;
const PRIOR_WEIGHT = 1;
export const PROVISIONAL_BELOW = 0.4;

export function scoreCategories(
  categories: Partial<Record<CategoryId, number>>,
  weights: Weights,
): { score: number; confidence: number } {
  let sum = 0;
  let wSum = 0;
  let wTotal = 0;
  for (const { id } of CATEGORIES) {
    const w = weights[id] ?? 0;
    wTotal += w;
    const v = categories[id];
    if (v == null || w === 0) continue;
    sum += v * w;
    wSum += w;
  }
  if (wSum === 0) return { score: 0, confidence: 0 };
  const score = (sum + PRIOR_SCORE * PRIOR_WEIGHT) / (wSum + PRIOR_WEIGHT);
  return { score, confidence: wTotal ? wSum / wTotal : 0 };
}

/** Re-score and re-rank models under custom weights. Returns new objects sorted by rank. */
export function rankModels<T extends Pick<Model, "categories">>(
  models: T[],
  weights: Weights,
): (T & { score: number; confidence: number; rank: number; provisional: boolean })[] {
  return models
    .map((m) => {
      const { score, confidence } = scoreCategories(m.categories, weights);
      return { ...m, score, confidence, provisional: confidence < PROVISIONAL_BELOW, rank: 0 };
    })
    .sort((a, b) => b.score - a.score)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}
