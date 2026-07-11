import brand from '../pixar-brand.json' with { type: 'json' }
import audienceCache from '../data/audience-cache.json' with { type: 'json' }
import { geminiText, hasGeminiKey } from './lib/gemini.js'
import { ok, fail } from './lib/respond.js'
import { rateLimited, untrusted, UNTRUSTED_RULE } from './lib/guard.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'POST only', 405)
  if (rateLimited(req)) return fail(res, 'Too many requests, give it a minute')
  if (!hasGeminiKey()) return fail(res, 'Add GEMINI_API_KEY to enable live personas')

  const { film = '' } = req.body || {}
  const filmInfo = brand.films.find((f) => f.name === film)
  if (!filmInfo) return fail(res, `Unknown film: ${film || '(none)'}`)
  const cached = audienceCache.films[film]
  if (!cached?.reviews?.length) return fail(res, `No cached audience feedback for ${film} yet`)

  const prompt = `You are Persona Studio for ${brand.brand}'s marketing team. Build 2-3 marketing personas for the film "${film}" from real audience signals. ${UNTRUSTED_RULE}

FILM: ${JSON.stringify(filmInfo)}
BRAND AUDIENCE MAP: ${JSON.stringify(brand.audience)}
AUDIENCE SIGNALS (the only evidence, never invent beyond them):
${untrusted('audience-feedback', JSON.stringify(cached.reviews))}

Return ONLY valid JSON:
{"personas": [{
  "name": "<memorable alliterative name, e.g. 'Weekend Planner Priya'>",
  "segment": "<one line: who they are>",
  "quote_basis": "<a VERBATIM quote from the signals this persona grows from>",
  "wants": "<one line>",
  "fears": "<one line: what makes them skip a film>",
  "media": "<where they actually spend attention>",
  "winning_hooks": ["<1-2 ad hooks in the brand voice that would stop this exact person>"],
  "targeting": "<one line of practical channel/timing/format targeting notes>"
}]}

Rules:
- Every persona must cite a verbatim quote_basis from the signals.
- Personas must map to different segments from the brand audience map.
- Hooks obey the brand voice and anti-slop rules: ${brand.anti_slop.hard_bans.join('; ')}.
- No em dashes anywhere.`

  try {
    const data = await geminiText(prompt, { temperature: 0.6, json: true, model: 'gemini-2.5-pro' })
    if (!Array.isArray(data.personas) || !data.personas.length) return fail(res, 'Model returned no personas')
    return ok(res, { personas: data.personas.slice(0, 3) })
  } catch (err) {
    return fail(res, err.message)
  }
}
