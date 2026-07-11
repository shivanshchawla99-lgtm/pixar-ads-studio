import brand from '../pixar-brand.json' with { type: 'json' }
import { geminiText, hasGeminiKey } from './lib/gemini.js'
import { ok, fail } from './lib/respond.js'
import { rateLimited, untrusted, UNTRUSTED_RULE } from './lib/guard.js'

const CATEGORIES = brand.story_guard_scoring.categories.map((c) => c.name)

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'POST only', 405)
  if (rateLimited(req)) return fail(res, 'Too many requests, give it a minute')
  if (!hasGeminiKey()) return fail(res, 'Add GEMINI_API_KEY to enable live screenings')

  const { film = '', brief = '', audience = '' } = req.body || {}
  if (!brief.trim()) return fail(res, 'Nothing to screen: brief is empty')
  const filmInfo = brand.films.find((f) => f.name === film)

  const prompt = `You are the Screening Room for ${brand.brand}'s marketing studio. Write FOUR distinct ad copy variants for one brief, then score each against the brand rules, exactly like Story Guard would. ${UNTRUSTED_RULE}

BRIEF: ${untrusted('brief', brief.slice(0, 600))}
${filmInfo ? `FILM: ${JSON.stringify(filmInfo)}` : 'FILM: whole slate'}
${audience ? `AUDIENCE: ${untrusted('audience', String(audience).slice(0, 300))}` : ''}

BRAND RULES:
${JSON.stringify({
    voice: brand.voice,
    lexicon: brand.lexicon,
    claim_check: brand.claim_check,
    anti_slop: brand.anti_slop,
    scoring: brand.story_guard_scoring.categories,
    true_claims: brand.true_claims,
  })}

Variant strategy:
- Variant 1 and 2: two genuinely different strong approaches (different emotional angle or audience read).
- Variant 3: the generic version a lazy agency would write. It should score poorly on Story & heart and No-slop.
- Variant 4: the hype version that breaks claim rules (invented consensus, banned superlatives). It should score very poorly.
Variants 3 and 4 exist so the team sees WHY the winners win. Write them convincingly, score them honestly.

Return ONLY valid JSON:
{"variants": [{
  "hook": "<the headline/hook>",
  "primary_text": "<1-2 sentences of primary text>",
  "cta": "<max 4 words>",
  "scores": {${CATEGORIES.map((c) => `"${c}": <0-100>`).join(', ')}},
  "overall": <0-100, dragged down by the weakest category>,
  "verdict": "<one honest sentence on why this scores what it scores>",
  "winner": <true for exactly the single highest-overall variant, false otherwise>
}]}

Rules: exactly 4 variants, exactly one winner, winners must be spoiler-safe and claim-clean, no em dashes anywhere.`

  try {
    const data = await geminiText(prompt, { temperature: 0.7, seed: 7, json: true, model: 'gemini-2.5-pro' })
    if (!Array.isArray(data.variants) || data.variants.length !== 4) return fail(res, 'Model returned an unexpected shape')
    // Exactly one winner, decided by scores even if the model mislabels.
    const top = data.variants.reduce((a, b) => (b.overall > a.overall ? b : a))
    data.variants.forEach((v) => { v.winner = v === top })
    return ok(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}
