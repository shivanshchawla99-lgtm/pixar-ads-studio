import brand from '../pixar-brand.json' with { type: 'json' }
import { geminiText, hasGeminiKey } from './lib/gemini.js'
import { ok, fail } from './lib/respond.js'
import { rateLimited, untrusted, UNTRUSTED_RULE } from './lib/guard.js'

const MAX_CHARS = 4000

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'POST only', 405)
  if (rateLimited(req)) return fail(res, 'Too many requests, give it a minute')
  if (!hasGeminiKey()) return fail(res, 'Add GEMINI_API_KEY to enable live scoring')

  const { type = 'Instagram caption', title = '', content = '' } = req.body || {}
  if (!content.trim()) return fail(res, 'Nothing to score: content is empty')

  const text = content.slice(0, MAX_CHARS)
  const safeTitle = String(title).slice(0, 200)

  const prompt = `You are Story Guard for ${brand.brand}'s marketing studio. Score this ${type} against the brand file below. ${UNTRUSTED_RULE}

BRAND FILE (single source of truth):
${JSON.stringify({
    voice: brand.voice,
    lexicon: brand.lexicon,
    marketing_standards: brand.marketing_standards,
    claim_check: brand.claim_check,
    anti_slop: brand.anti_slop,
    scoring: brand.story_guard_scoring.categories,
    true_claims: brand.true_claims,
  })}

POST TO SCORE:
${safeTitle ? `Title: ${untrusted('title', safeTitle)}\n` : ''}${untrusted('post', text)}

Return ONLY valid JSON with exactly this shape:
{
  "overall": <0-100 integer>,
  "categories": {
    "Story & heart": <0-100>,
    "Claim validity": <0-100>,
    "Brand voice": <0-100>,
    "No-slop": <0-100>
  },
  "feedback": {
    "Story & heart": [{"snippet": "<exact quote from the post>", "problem": "<what's wrong>", "fix": "<how to fix it>"}],
    "Claim validity": [...],
    "Brand voice": [...],
    "No-slop": [...]
  },
  "rewrite": "<an on-brand, spoiler-safe rewrite of the whole post in the brand voice. No em dashes. If the post is already clean, instead explain briefly why it is on-brand.>"
}

Rules:
- Quote the EXACT snippet from the post for every pointer.
- A category with no problems gets an empty array and a score of 90+.
- overall reflects the weakest categories; a post with banned claims (guaranteed, instant classic, invented critic quotes, fake scores) must score below 50 overall.
- A clean, warm, story-first, spoiler-safe post scores 90+ with all feedback arrays empty.
- Never invent problems. Never use em dashes anywhere in your output.`

  try {
    // Scores are pinned three ways: temperature 0 + fixed seed, median of 3 parallel
    // runs, and scores snapped to steps of 5. Kills run-to-run wobble.
    const opts = { temperature: 0, seed: 7, topK: 1, json: true }
    const runs = await Promise.allSettled([1, 2, 3].map(() => geminiText(prompt, opts)))
    const valid = runs
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((d) => typeof d.overall === 'number' && d.categories && d.feedback && d.rewrite)
      .sort((a, b) => a.overall - b.overall)
    if (!valid.length) {
      const firstErr = runs.find((r) => r.status === 'rejected')
      return fail(res, firstErr ? firstErr.reason.message : 'Model returned an unexpected shape')
    }
    const data = valid[Math.floor(valid.length / 2)]
    const snap = (n) => Math.max(0, Math.min(100, Math.round(n / 5) * 5))
    for (const c of Object.keys(data.categories)) data.categories[c] = snap(data.categories[c])

    // Continuous Scaled Difference (CSD) scoring — mirror of StoryGuard.jsx, keep in sync.
    const weakest = Math.min(...Object.values(data.categories))
    if (weakest < 50) {
      data.overall = weakest
    } else {
      let bonus = 0
      Object.values(data.categories).forEach((score) => {
        if (score > weakest) bonus += 0.35 * (score - weakest)
      })
      data.overall = Math.min(100, Math.round(weakest + (weakest / 100) * bonus))
    }

    return ok(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}
