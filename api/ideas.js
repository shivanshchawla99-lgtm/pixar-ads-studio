import brand from '../pixar-brand.json' with { type: 'json' }
import { geminiText, hasGeminiKey } from './lib/gemini.js'
import { ok, fail } from './lib/respond.js'
import { rateLimited } from './lib/guard.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'POST only', 405)
  if (rateLimited(req)) return fail(res, 'Too many requests, give it a minute')
  if (!hasGeminiKey()) return fail(res, 'Add GEMINI_API_KEY to enable fresh sparks')

  const prompt = `You are the Spark Engine for ${brand.brand}'s marketing studio. Generate 6 fresh, story-first campaign ideas for the film slate.

BRAND FILE:
${JSON.stringify({
    one_liner: brand.one_liner,
    positioning: brand.positioning,
    audience: brand.audience,
    voice: brand.voice,
    lexicon: brand.lexicon,
    anti_slop: { hard_bans: brand.anti_slop.hard_bans, prove_it_test: brand.anti_slop.prove_it_test },
    films: brand.films,
    true_claims: brand.true_claims,
  })}

Return ONLY valid JSON:
{"ideas": [{"title": "<short punchy title>", "film": "<one film name from the slate>", "angle": "<one line: the specific story-first angle>", "why_it_matters": "<one line: why this lands with the film's audience focus right now>", "channel": "<Instagram Reel | Instagram carousel | Newsletter | LinkedIn post | Facebook post>", "hook": "<the opening line, in the brand voice>", "source": "<one line naming what grounds this: a film motif, an audience segment, or a true claim>"}]}

Rules:
- Exactly 6 ideas, varied channels, at least 3 different films.
- Every idea must pass the prove-it test: only this film could run it.
- Only claim things that are true from the brand file. Never invent critic quotes, scores, or awards.
- Never spoil anything beyond each film's logline.
- No em dashes, no trailer-voice, no banned slop patterns anywhere.`

  try {
    const data = await geminiText(prompt, { temperature: 0.9, json: true, model: 'gemini-2.5-pro' })
    if (!Array.isArray(data.ideas) || !data.ideas.length) return fail(res, 'Model returned no ideas')
    return ok(res, { ideas: data.ideas.slice(0, 6) })
  } catch (err) {
    return fail(res, err.message)
  }
}
