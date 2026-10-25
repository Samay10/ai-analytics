# AI Model Leaderboard — Build Plan

## Goal
A live 3D leaderboard that ranks frontier AI models by a composite of their published benchmarks. Data refreshes hourly and costs nothing to run.

## Architecture (zero cost)
```
GitHub Actions (hourly cron)
  └─ scripts/ingest.ts  → fetch sources → normalize → score
       └─ commits public/data/latest.json + public/data/history/YYYY-MM-DD.json
            └─ push triggers redeploy (Vercel Hobby / Cloudflare Pages)
                 └─ page polls latest.json every 5 min, animates rank changes
```
No database and no server. The repo itself stores the history.

## Data sources
| Source | Data | Key |
|---|---|---|
| Artificial Analysis API | Intelligence index, MMLU-Pro, GPQA Diamond, HLE, LiveCodeBench, AIME, SciCode, price, speed | `AA_API_KEY` (you provide) |
| LMArena | Elo ratings from human votes (text, coding, vision) | none |
| OpenRouter `/api/v1/models` | New releases, context window, pricing | none |
| Epoch AI Benchmarking Hub | Historical scores, used to backfill rank history | none (CSV) |
| `data/seed.json` | Hand-curated fallback when a source is down | — |

The same model appears under different names in each source. A model-matching step (alias table plus fuzzy matching) merges them into one canonical ID per model, e.g. `anthropic/claude-opus-4.x`.

## Scoring
1. Normalize each benchmark to 0–100 by scaling between the lowest and highest score among current models.
2. Group benchmarks into categories: **Reasoning, Coding, Math, Knowledge, Human preference (Arena), Agentic**.
3. Composite score = weighted mean of the category scores. Default weights are equal, and the user can change them in the UI.
4. Confidence = share of benchmarks the model actually has scores for. Models below 40% are labeled "provisional".
5. Track rank change against yesterday's ranking and against 7 days ago.

## UI / views
1. **Model Galaxy (hero)**: R3F scene. Each model is a glowing sphere; distance from the core = rank, size = score, color = company. New releases fly in with a particle burst. Hover shows a card; click zooms the camera in and opens a detail panel.
2. **Detail panel**: benchmark radar chart, price, speed, context window, release date, rank history sparkline.
3. **Rank race**: 3D ribbon chart of rank over time, with a time slider.
4. **Benchmark skyline**: 3D bar grid of models × benchmarks.
5. **Value map**: score vs. price scatter, highlighting the models with no cheaper-and-better alternative.
6. **Live ticker**: a feed of new models and rank changes.
7. **Controls**: weight sliders, open vs. closed filter, company filter, search (⌘K).
8. **Fallback**: 2D table view on mobile, low-end GPUs, or when the user prefers reduced motion.

Look and feel: dark, glassmorphic panels, bloom glow, smooth camera transitions between views.

## Stack
Next.js 15 (static export) · TypeScript · Tailwind · React Three Fiber + drei + postprocessing · Framer Motion · Zustand (UI state) · Zod (validates incoming source data) · tsx (to run the ingest script)

## Structure
```
scripts/ingest.ts            # orchestrates fetch → match → score → write
lib/sources/{aa,arena,openrouter,epoch}.ts
lib/{match,score,types}.ts
data/{aliases,seed}.json
public/data/{latest.json,history/}
app/page.tsx
components/galaxy/*  components/views/*  components/ui/*
.github/workflows/ingest.yml
```

## Phases
1. **Data pipeline**: source fetchers, model matching, scoring, JSON output, GitHub Actions workflow. *Done when:* `npm run ingest` produces a valid `latest.json`.
2. **Galaxy + detail panel**: the hero 3D scene, hover/click interactions, live polling.
3. **Controls + ticker**: weight sliders, filters, search, rank-change animations.
4. **Extra views**: rank race, skyline, value map.
5. **Polish + deploy**: performance tuning, 2D fallback, deployment, README.

## Needed from you
- `AA_API_KEY` from artificialanalysis.ai
- A GitHub repo (public is fine, and gives unlimited free Actions minutes)
- Hosting choice: Vercel Hobby or Cloudflare Pages
