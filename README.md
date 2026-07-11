# Pixar Ads Studio

An AI-powered marketing studio concept: **analyse your audience, build winning ads**. Six tools, one brand file, one pipeline, cache-first everything — every tool opens on a pre-baked golden result and never shows an error screen, even with zero API keys.

> **Unofficial fan concept.** Not affiliated with, endorsed by, or connected to Pixar or Disney. Every film in the demo is fictional and all audience feedback is synthetic demo data. Built as an AI implementation showcase.

## The pipeline

| # | Tool | Core competency | API |
|---|------|-----------------|-----|
| 1 | **Audience Lab** | Mines audience feedback per film into sentiment, themes with verbatim quotes, and ready ad angles | `POST /api/audience` |
| 2 | **Persona Studio** | Grows living personas from those signals: wants, fears, media habits, winning hooks, targeting notes | `POST /api/personas` |
| 3 | **Spark Engine** | Always-on, brand-grounded campaign ideas, each one a click from production | `POST /api/ideas` |
| 4 | **Poster Studio** | Brand-locked posters and social creatives; palette, type and wordmark fixed, engines swappable | `POST /api/creative` |
| 5 | **Screening Room** | Four ad copy variants per brief, scored head-to-head by the brand rules; winner crowned | `POST /api/variants` |
| 6 | **Story Guard** | Scores any copy against story, claims, voice and no-slop rules; categorized fixes + on-brand rewrite | `POST /api/validate` |

Tools hand off to each other (an Audience Lab angle → Poster Studio; a Persona → Screening Room; any caption → Story Guard). Everything reads from [pixar-brand.json](pixar-brand.json), the single source of truth. The CSS design tokens in [src/index.css](src/index.css) mirror the brand file's colour section 1:1 — change both together.

## Setup

```bash
npm install
npm run dev          # frontend only (APIs need vercel dev or the deployed URL)
npx vercel dev       # frontend + serverless functions locally
```

**Keys** (all optional — the whole demo runs on cached golden results without them):

- `GEMINI_API_KEY` — enables live text + image runs in every tool.
- `OPENAI_API_KEY` — enables the ChatGPT engine in Poster Studio.

Never put keys in code. Missing keys degrade gracefully to cached results with a quiet toast.

## Cache-first contract

On load, each tool renders its golden result from `data/golden/` instantly. A live run calls `/api/*`; on success the result swaps in with a **Live** badge; on any failure (timeout, 429, refusal, missing key) the golden result stays with a **Cached** tag and a quiet toast. Functions always return `{ ok, data, error }` with HTTP 200 (deliberate: the client treats `ok:false` as "fall back to cached", never as an exception).

## Guardrails

- Untrusted text (scored copy, audience feedback, briefs) is wrapped in `<untrusted>` delimiters with a standing treat-as-data instruction before it reaches any prompt.
- Cost-bearing endpoints have a best-effort per-IP rate limit (10/min).
- The image pipeline never renders human faces or recognisable characters — silhouettes and motifs only, enforced in the locked design-brief spec, with no keyword escape hatch.
- Story Guard shows an **Unscored edits** badge the moment the text diverges from the scored version, and labels projected scores as estimates.

## Demo script (~8 min)

1. **Audience Lab** — open on Luma: real (demo) screening notes → themes with verbatim quotes → ad angles. Click **Send to Poster Studio** on an angle to show the pipeline.
2. **Persona Studio** — three personas grown from those same quotes; click **Test ad variants for this persona**.
3. **Screening Room** — lands pre-filled: four variants, scored; the lazy-agency and hype versions lose on purpose. Click **Make the poster** on the winner.
4. **Poster Studio** — the brief arrives pre-filled; the golden creative is already on screen. Generate live if keys are set; **Check in Story Guard** on the caption.
5. **Story Guard** — walk the bad example (8/100, invented critic quotes, trailer-voice), tick fixes to see the estimated score climb, load the good example (94).
6. Close on the home page: one brand file, six tools, nothing ships without a screening.

## Re-skinning for a real client

This is the consulting pitch: swap `pixar-brand.json`, the CSS tokens, the golden JSONs in `data/golden/`, and the SVGs in `public/golden` + `public/scores`. Prompts, tools, pipeline and guardrails carry over unchanged. See [EXPERIMENTS.md](EXPERIMENTS.md) for what was tried, what won, and what was cut.
