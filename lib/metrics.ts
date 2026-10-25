import type { CategoryId, MetricDef } from "./types";

export const CATEGORIES: { id: CategoryId; label: string; color: string }[] = [
  { id: "general", label: "General", color: "#7dd3fc" },
  { id: "reasoning", label: "Reasoning", color: "#a78bfa" },
  { id: "coding", label: "Coding", color: "#34d399" },
  { id: "math", label: "Math", color: "#fbbf24" },
  { id: "agentic", label: "Agentic", color: "#f472b6" },
  { id: "preference", label: "Human pref.", color: "#fb7185" },
];

export const METRICS: MetricDef[] = [
  { id: "epoch.eci", label: "Epoch Capabilities Index", category: "general", source: "epoch", unit: "index" },
  { id: "aa.intelligence", label: "AA Intelligence Index", category: "general", source: "aa", unit: "index" },
  { id: "aa.mmlu_pro", label: "MMLU-Pro", category: "general", source: "aa", unit: "%" },

  { id: "epoch.gpqa", label: "GPQA Diamond (Epoch)", category: "reasoning", source: "epoch", unit: "%" },
  { id: "epoch.hle", label: "Humanity's Last Exam (Epoch)", category: "reasoning", source: "epoch", unit: "%" },
  { id: "aa.gpqa", label: "GPQA Diamond (AA)", category: "reasoning", source: "aa", unit: "%" },
  { id: "aa.hle", label: "Humanity's Last Exam (AA)", category: "reasoning", source: "aa", unit: "%" },

  { id: "epoch.swe", label: "SWE-bench Verified", category: "coding", source: "epoch", unit: "%" },
  { id: "aa.livecodebench", label: "LiveCodeBench", category: "coding", source: "aa", unit: "%" },
  { id: "aa.scicode", label: "SciCode", category: "coding", source: "aa", unit: "%" },
  { id: "aa.coding_index", label: "AA Coding Index", category: "coding", source: "aa", unit: "index" },
  { id: "arena.webdev", label: "WebDev Arena", category: "coding", source: "arena", unit: "elo" },

  { id: "epoch.frontiermath", label: "FrontierMath", category: "math", source: "epoch", unit: "%" },
  { id: "epoch.aime", label: "OTIS Mock AIME", category: "math", source: "epoch", unit: "%" },
  { id: "aa.math_index", label: "AA Math Index", category: "math", source: "aa", unit: "index" },

  { id: "epoch.terminal", label: "Terminal-Bench", category: "agentic", source: "epoch", unit: "%" },
  { id: "aa.terminalbench_hard", label: "Terminal-Bench Hard (AA)", category: "agentic", source: "aa", unit: "%" },
  { id: "aa.tau2", label: "τ²-Bench", category: "agentic", source: "aa", unit: "%" },

  { id: "arena.text", label: "LMArena Text", category: "preference", source: "arena", unit: "elo" },
];

export const METRIC_BY_ID = new Map(METRICS.map((m) => [m.id, m]));
