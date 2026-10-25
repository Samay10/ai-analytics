export type SourceId = "aa" | "arena" | "epoch" | "openrouter";

export type CategoryId =
  | "general"
  | "reasoning"
  | "coding"
  | "math"
  | "agentic"
  | "preference";

export interface MetricDef {
  id: string;
  label: string;
  category: CategoryId;
  source: SourceId;
  unit: "%" | "elo" | "index";
}

export interface Pricing {
  input: number;
  output: number;
}

/** One model as reported by one source, before cross-source matching. */
export interface SourceRecord {
  source: SourceId;
  name: string;
  org?: string;
  openWeights?: boolean;
  releaseDate?: string;
  metrics: Record<string, number>;
  pricing?: Pricing;
  contextLength?: number;
  speed?: number;
  openrouterId?: string;
}

export interface Model {
  id: string;
  name: string;
  org: string;
  openWeights: boolean | null;
  releaseDate: string | null;
  metrics: Record<string, number>;
  normalized: Record<string, number>;
  categories: Partial<Record<CategoryId, number>>;
  score: number;
  rank: number;
  confidence: number;
  provisional: boolean;
  pricing: Pricing | null;
  contextLength: number | null;
  speed: number | null;
  openrouterId: string | null;
  sources: SourceId[];
  rankDelta1d: number | null;
  rankDelta7d: number | null;
}

export interface FeedEvent {
  id: string;
  date: string;
  type: "release" | "rank_up" | "rank_down" | "new_leader";
  modelId: string | null;
  text: string;
}

export interface SourceStatus {
  id: SourceId;
  ok: boolean;
  count: number;
  cached: boolean;
}

export interface Dataset {
  generatedAt: string;
  sources: SourceStatus[];
  metrics: MetricDef[];
  models: Model[];
  events: FeedEvent[];
}

export type Weights = Record<CategoryId, number>;
