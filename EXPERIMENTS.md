# Experiments log — winners and losers

Every meaningful design/build decision in the Pixar Ads Studio derivative, with the outcome. Losers were deleted from the codebase, not just disabled. (Derived from the Truly Creative codebase after a full /autoplan review + /office-hours diagnostic on 2026-07-11.)

## Winners (kept or newly built)

| Experiment | Verdict | Why it won |
|---|---|---|
| Cache-first golden results, zero required keys | **Winner (inherited)** | The demo can never error on stage; the single strongest pattern in the original |
| One brand file driving all prompts | **Winner (inherited, fixed)** | Now actually true: claims, wordmark, films, palette all live in `pixar-brand.json`; CSS tokens mirror it 1:1 |
| Two-stage creative pipeline (copy brief → locked JSON design spec → image model) | **Winner (inherited)** | Guardrails stay out of the model's hands |
| Projected-score checkboxes in Story Guard | **Winner, amended** | Great demo moment; now labelled "estimated… re-validate to confirm" after review flagged fabricated precision |
| **Cross-tool handoff (the pipeline)** | **New — biggest win** | sessionStorage + hash routing, ~30 lines; turns six silos into one story: insight → persona → variant → poster → guard |
| **Persona Studio** | **New winner** | Completes the "analyse customers" pillar; every persona cites the verbatim quote it grew from |
| **Screening Room** (4 variants, 2 strong + 1 generic + 1 hype, scored honestly) | **New winner** | Directly demos "winning ads"; keeping the losers on screen teaches why the winner wins |
| Deliberate bad variants in Screening Room goldens | **Winner** | The 7/100 hype variant is the most persuasive thing in the demo |
| Premiere-night dark theme + SVG poster goldens | **Winner** | Self-contained (no image-gen needed for goldens), on-palette, tiny repo |
| Staleness badge in Story Guard | **New winner** | Fixes the worst UX finding: the verdict can no longer sit silently next to edited text |
| `<untrusted>` delimiting + soft rate limit | **New winner** | Cheap mitigations for the two worst security findings (prompt injection, open wallet) |
| Handoff consume-on-mount | **Loser → fixed** | Tools stay mounted across tab switches, so a mount-time `receiveFor` never fired after first render; replaced with a hashchange-driven `useHandoff` hook, verified end-to-end in the browser |

## Losers (deleted)

| Experiment | Verdict | Why it lost |
|---|---|---|
| Google Drive auto-save (`api/lib/drive.js`, 71 lines of hand-rolled JWT) | **Cut** | Setup friction, another key, zero demo value; Download covers it |
| Higgsfield "coming soon" locked button | **Cut** | Permanently disabled UI reads as broken in a public demo |
| Places live review refresh (`api/reviews-refresh.js`) | **Cut** | Dead code in the original (unwired, couldn't persist); fictional films have no Places entries |
| Photo-upload + "real people" regex escape hatch in creative.js | **Cut** | The regex inverted the brand's hardest image rule; this brand never renders faces, so the whole branch went |
| Region/currency/finance-partner mapping (humm, EUR/GBP/AED) | **Cut** | Dental-specific; film offers carry their own terms in-asset |
| Persisting generated images in sessionStorage | **Cut** | Multi-MB base64 blows the ~5MB quota and silently kills persistence; only the form persists now |
| Gallery cards opening raw image files in a new tab | **Cut** | Ejected users from the app; cards now load the preset into the workspace |
| Curtain intro (4 colour panels) | **Replaced** | Off-brand for premiere night; replaced with a projector-beam sweep + iris-in |
| Sticky full-viewport section stack on Home | **Replaced** | 4 sticky 100dvh sections don't scale to 6 tools; replaced with a pipeline narrative + one followed thread |
| Phantom feature claims on Home ("scrapes competitor blogs", "feedback loop") | **Cut** | A lead-gen demo must survive "show me"; every Home claim now maps to shipped behaviour |

## Deferred (honestly labelled coming-soon, not built)

- Competitor ad analysis — no realistic data source without ad-library APIs.
- Campaign planner/calendar — surface too big for demo payoff.
- Performance loop ("what won") — needs pasted/imported ad results; the right next tool once a prospect converts.
- Live social listening feeds — same reason.

## The assignment (from /office-hours)

Put the deployed URL in front of 3 real prospects, watch them click unaided, and log where they stall — in this file.

## Design pass 2 — Pixar brand guidelines (2026-07-11)

Re-themed against the supplied brand system, using /design-taste-frontend for the web design and /emil-design-eng for motion.

| Change | Verdict | Why |
|---|---|---|
| Emotion palette (Pixar Red CTAs, Midnight Theater, Joy/Purple/Ocean/Ember) | **Winner** | Each tool now carries its own mood colour; red reserved for CTAs + Story Guard, per guidelines |
| Nunito heavy display (was Fredoka) | **Winner** | Matches the named "bold friendly rounded geometric sans"; no serifs in UI |
| Cinematic posters: volumetric key light + atmospheric depth + film grain | **Winner** | Honors "lighting is everything" and "texture" without an image-gen tool; stays self-contained |
| Squash-and-stretch tactile buttons + organic easing + card lift | **Winner** | 12 principles via emil; press feedback + follow-through, reduced-motion honored |
| Luxo lamp 5-tap → Room A113 concept gallery | **Winner** | Rewards exploration; ref-based counter (state closure counted stale on rapid clicks) |
| Pizza Planet truck with A113 licence plate in hero parallax | **Winner** | Two easter eggs in one prop, subtle, non-blocking |
| CSS scroll-driven reveal (`animation-timeline: view()`) | **Loser → replaced** | Left below-fold sections invisible in a flat render; swapped for IntersectionObserver + 1.5s safety net so content is never hidden |
| Em-dashes in visible copy | **Loser → removed** | Zero-em-dash pre-flight; kept only the one in Story Guard's bad example, which its own feedback teaches about |
