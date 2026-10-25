# Orbital — live AI model rankings

Live 3D analytics for frontier AI models. Aggregates Artificial Analysis, LMArena, OpenRouter, and Epoch AI benchmarks into a weighted composite ranking, updated hourly. Interactive galaxy view, rank race, and value map.

## How it works

```
GitHub Actions (hourly) → npm run ingest → public/data/latest.json → static site redeploys → page polls every 5 min
```

| Source | Used for | Credentials |
|---|---|---|
| [Epoch AI Benchmarking Hub](https://epoch.ai/data/ai-benchmarking-dashboard) | ECI, GPQA Diamond, HLE, FrontierMath, OTIS AIME, SWE-bench Verified, Terminal-Bench, release dates | none |
| [LMArena](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) | Text and WebDev Elo | none |
| [OpenRouter](https://openrouter.ai/api/v1/models) | New releases, pricing, context window | none |
| [Artificial Analysis](https://artificialanalysis.ai/documentation) | Intelligence/coding/math indexes, MMLU-Pro, LiveCodeBench, τ²-Bench, speed | `AA_API_KEY` (optional) |

**Scoring.** Each benchmark is min–max normalized to 0–100 across models released in the last 18 months. Benchmarks are averaged into six categories (general, reasoning, coding, math, agentic, human preference), and the composite is a weighted mean of available categories shrunk toward 50 by one prior weight, so models with few benchmarks can't top the board. Models covering under 40% of the weighted categories are marked provisional. Weights are adjustable in the UI.

**Matching.** Each source names models differently; `lib/match.ts` normalizes names into one key, and `data/aliases.json` handles the leftovers.

## Development

```bash
npm install
npm run ingest   # fetch sources, write public/data/
npm run dev
npm run build    # static export to out/
```

If a source fails, ingest falls back to its last good copy in `data/cache/`.

## Deploy

1. Add `AA_API_KEY` under repo **Settings → Secrets and variables → Actions** (optional).
2. Import the repo on Vercel (Hobby) or Cloudflare Pages: build `npm run build`, output `out`.
3. The `Ingest benchmarks` workflow runs hourly and commits new data, which triggers a redeploy. Run it manually from the Actions tab the first time.
