import brand from '../pixar-brand.json' with { type: 'json' }
import audienceCache from '../data/audience-cache.json' with { type: 'json' }
import { geminiText, hasGeminiKey } from './lib/gemini.js'
import { ok, fail } from './lib/respond.js'
import { rateLimited, untrusted, UNTRUSTED_RULE } from './lib/guard.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'POST only', 405)
  if (rateLimited(req)) return fail(res, 'Too many requests, give it a minute')
  if (!hasGeminiKey()) return fail(res, 'Add GEMINI_API_KEY to enable live analysis')

  const { film = '' } = req.body || {}
  const cached = audienceCache.films[film]
  if (!cached || !cached.reviews?.length) {
    return fail(res, `No cached audience feedback for ${film || 'this film'} yet`)
  }

  const thin = cached.reviews.length < 3

  const prompt = `You analyse audience screening feedback for ${brand.brand}'s film "${film}" and turn what audiences love into ad angles. ${UNTRUSTED_RULE}

FEEDBACK (the only source of truth, never invent beyond it):
${untrusted('audience-feedback', JSON.stringify(cached.reviews))}

BRAND VOICE: ${JSON.stringify(brand.voice)}
LEXICON prefer: ${brand.lexicon.prefer.join(', ')}. Avoid: ${brand.lexicon.avoid.join(', ')}.
IMAGE RULES for visuals: ${brand.image_rules.palette_direction} ${brand.image_rules.signature_layout}

Return ONLY valid JSON:
{
  "sentiment": "<2 sentence honest summary of overall sentiment, including any recurring gripe>",
  "thin": ${thin},
  "loves": [
    {
      "title": "<short name of the winning theme, what audiences love>",
      "quote": "<a VERBATIM quote from the feedback above>",
      "angles": [
        {"hook": "<ad hook in the brand voice>", "primary_text": "<one line of primary text, spoiler-safe, no banned claims>", "visual": "<suggested visual using the brand palette and layout rules, never off-model characters>"}
      ]
    }
  ]
}

Rules:
- ${thin ? 'Only 1 winning theme: feedback is sparse, say so honestly in sentiment and do NOT invent themes.' : '3 to 5 winning themes, each with 1-2 angles.'}
- Every quote must appear word for word in the feedback.
- Never spoil anything beyond act one.
- No em dashes, no trailer-voice, no banned words (guaranteed, instant classic, epic, unforgettable, best).`

  try {
    const data = await geminiText(prompt, { temperature: 0.5, json: true, model: 'gemini-2.5-pro' })
    if (!Array.isArray(data.loves) || !data.loves.length) return fail(res, 'Model returned no themes')
    return ok(res, data)
  } catch (err) {
    return fail(res, err.message)
  }
}
