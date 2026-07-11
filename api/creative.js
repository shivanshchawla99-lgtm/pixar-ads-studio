import brand from '../pixar-brand.json' with { type: 'json' }
import { geminiText, geminiImage, hasGeminiKey } from './lib/gemini.js'
import { openaiImage, hasOpenAIKey } from './lib/openai.js'
import { ok, fail } from './lib/respond.js'
import { rateLimited, untrusted, UNTRUSTED_RULE } from './lib/guard.js'

const ASPECTS = { '1080x1080': '1:1', '1080x1920': '9:16', '1200x628': '16:9' }

const stripDashes = (s) => String(s || '').replace(/\s*[—–]\s*/g, ', ').replace(/ -- /g, ', ')

// Trims whitespace, strips trailing punctuation, and only truncates at a word
// boundary if the text runs over the safety cap (never mid-word).
const cleanCopy = (s, cap) => {
  let t = String(s || '').trim().replace(/[.,;:!\s]+$/, '')
  if (t.length > cap) {
    t = t.slice(0, cap)
    const sp = t.lastIndexOf(' ')
    if (sp > 0) t = t.slice(0, sp)
    t = t.replace(/[.,;:!\s]+$/, '')
  }
  return t
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 'POST only', 405)
  if (rateLimited(req)) return fail(res, 'Too many requests, give it a minute')
  if (!hasGeminiKey()) return fail(res, 'Add GEMINI_API_KEY to enable live generation')

  const {
    brief = 'a social post',
    format = '1080x1080',
    film = '',
    offer = '',
    mood = 'wondrous and warm',
    accent = 'auto',
    engine = 'gemini',
    platform = '',
    audience = '',
    cta = '',
    layout = '',
    imagery = '',
  } = req.body || {}

  if (engine === 'chatgpt' && !hasOpenAIKey()) return fail(res, 'Add OPENAI_API_KEY to enable the ChatGPT engine')

  const filmInfo = brand.films.find((f) => f.name === film)
  const filmContext = filmInfo
    ? `This asset is for the film "${filmInfo.name}": ${filmInfo.logline} Audience focus: ${filmInfo.audience_focus}. Release: ${filmInfo.release}. Signature motifs: ${filmInfo.motifs.join(', ')}.`
    : 'This asset is for the whole slate, not one film.'

  const details = [
    offer && `Offer or message: ${offer}.`,
    platform && `Platform: ${platform}.`,
    audience && `Target audience: ${audience}.`,
    imagery && `Extra art direction: ${imagery}.`,
  ].filter(Boolean).join(' ')

  // STAGE 1: Gemini writes the copy slots of the JSON brief from the form.
  // Guardrail fields (background, style, palette, wordmark, strict_rules) are
  // locked in Stage 2, never left to the model. Falls back to the offer/brief
  // if the call hiccups so it never blocks.
  const ACCENT_NAMES = ['lamplight yellow', 'ember orange', 'sky blue', 'teal', 'rose', 'violet']
  const cleanAccent = String(accent || '').toLowerCase().trim()
  const chosenAccent = ACCENT_NAMES.includes(cleanAccent) ? cleanAccent : ''
  let headline = cleanCopy(offer || brief, 80)
  let tag = cta ? cleanCopy(cta, 48) : ''
  let accents = chosenAccent ? [chosenAccent] : []
  try {
    const h = await geminiText(
      `You are a senior copywriter for ${brand.brand}, a story-first animation studio. Write the on-image copy for one ${platform || 'Instagram'} post. ${UNTRUSTED_RULE}
What the post is about: ${untrusted('brief', String(brief).slice(0, 600))} ${details}
${filmContext}
Brand voice: ${JSON.stringify(brand.voice)}. Words to prefer: ${brand.lexicon.prefer.join(', ')}. Never use: ${brand.lexicon.avoid.join(', ')}, guaranteed, instant classic, unforgettable, best.
Write ONE headline that does most of the work:
- One idea only: the single most story-true thing for this audience.
- Be concrete: a character, a want, a moment beats any adjective. Say the feeling plainly.
- Plain verbs. Sentence case. Eight words or fewer. No trailing punctuation.
- Never spoil anything beyond the film's logline. Never invent quotes, scores or awards.
- Banned (they read as AI or trailer-voice): "not X but Y", three-part lists, "In a world", "This summer, get ready", the words delve, unlock, elevate, seamless, journey, game-changer, epic, and any em dash.
Return ONLY JSON:
{"headline":"<the headline>"${cta ? '' : `,
 "tag":"<a short call to action for a pill button, max 4 words, plain, no trailing punctuation, or empty string>"`}${chosenAccent ? '' : `,
 "accents":["<one or two colour names from EXACTLY this list: ${ACCENT_NAMES.join(', ')}>"]`}}`,
      { temperature: 0.5, seed: 7, json: true, model: 'gemini-2.5-pro' }
    )
    if (h && h.headline) {
      headline = cleanCopy(h.headline, 80)
      if (!cta && h.tag) tag = cleanCopy(h.tag, 48)
      if (!chosenAccent && Array.isArray(h.accents)) {
        accents = h.accents
          .map((a) => String(a).toLowerCase().trim())
          .filter((a) => ACCENT_NAMES.includes(a))
          .slice(0, 2)
      }
    }
  } catch {
    /* keep the fallback headline */
  }
  if (!tag && offer && !cta) tag = cleanCopy(offer, 48)
  headline = stripDashes(headline)
  tag = stripDashes(tag)

  const isStory = format === '1080x1920' || /story|reel/i.test(platform || '')
  const CANVAS = { '1080x1080': '1:1 square', '1080x1920': '9:16 vertical', '1200x628': '16:9 landscape' }

  // STAGE 2: assemble the STRUCTURED JSON design brief and hand THAT to the image
  // model. Guardrails are fixed here so the model can never drift off them. Unlike
  // the dental original there is no photo-request regex escape hatch: this brand
  // never renders realistic humans or off-model characters, full stop.
  const spec = {
    task: `A finished, ready-to-publish ${platform || 'Instagram'} post for ${brand.brand}, a story-first animation studio`,
    canvas: `exactly ${format.replace('x', ' by ')} pixels (${CANVAS[format] || '1:1 square'})`,
    background: 'deep midnight blue (#101629), premiere-night mood, flat colour, no gradients',
    style: 'flat, bold, modern colour-block poster design; silhouettes, abstract motifs and environments only; cinematic and warm, never busy; no outer frame, no drop shadows, no lens flares',
    colour_rules: brand.image_rules.palette_direction,
    ...(accents.length ? { accent_colours: accents } : {}),
    ...(filmInfo ? { film_motifs: filmInfo.motifs } : {}),
    headline: {
      text: headline,
      treatment: 'the clear hero, large and easy to read, rounded friendly display sans-serif, in warm paper white or lamplight yellow, spelled exactly as written and nothing else',
    },
    ...(tag ? { cta_pill: { text: tag, treatment: 'a rounded pill button in lamplight yellow with midnight text, spelled exactly as written' } } : {}),
    shapes: 'a few simple abstract shapes drawn from the film motifs (a glow, grass silhouettes, swim lanes, origami folds), small and purposeful, never filling the frame',
    wordmark: { text: 'PAS', subtext: 'unofficial concept', placement: 'one corner, small', colour: 'lamplight yellow' },
    mood,
    ...(audience ? { audience } : {}),
    ...(imagery ? { motifs: imagery } : {}),
    ...(layout ? { layout } : {}),
    ...(isStory ? { safe_zones: 'keep the headline, pill and wordmark within the central 70 percent of the canvas, leave about 15 percent clear space at the very top and very bottom for platform buttons, and centre the main content vertically' } : {}),
    strict_rules: [
      'render every word spelled correctly and exactly as written',
      'use only the words provided: no other text, no lorem ipsum, no captions, no hashtags, no colour codes, no extra logos, laurels, star ratings or watermarks',
      'never draw human faces, photorealistic people, or recognisable animated characters from any studio; silhouettes and abstract motifs only',
      'the final image must fill exactly the stated pixel dimensions; keep the headline, pill and wordmark within the central area with a clear margin so nothing is lost near the edges',
    ],
  }

  const wrapper = 'Generate this social media graphic exactly as described in the following JSON design brief. Follow every field precisely. Output only the finished image.'
  const imagePrompt = `${wrapper}\n\n${JSON.stringify(spec, null, 2)}`

  try {
    const ctaInstruction = cta
      ? 'Do NOT write any call to action or closing sign-off sentence at the end.'
      : 'End with a warm invitation, no pressure, based on the brief and offer.'

    const captionPrompt = `Write one ${platform || 'Instagram'} caption for ${brand.brand}, a story-first animation studio. ${UNTRUSTED_RULE}
About: ${untrusted('brief', String(brief).slice(0, 600))} ${details}
${filmContext}
Voice: ${JSON.stringify(brand.voice)}
Prefer: ${brand.lexicon.prefer.join(', ')}. Avoid: ${brand.lexicon.avoid.join(', ')}.
Only claim what is true: ${brand.true_claims.join('; ')}. Never invent critic quotes, scores or awards. Never use guaranteed, instant classic, unforgettable, epic, best.
How to write it well:
- Open on the character or the feeling, never a setup. Not "In a world", not "This summer".
- One idea. Two to four short sentences, written to one reader. Contractions are good.
- Name feelings plainly. Use one concrete act-one moment; never spoil past it.
- Vary sentence length. End on something concrete, not a moral or a slogan.
- Banned: em dashes, hashtags, exclamation spam, "not X but Y", three-part lists, fake question pivots, trailer-voice, and the words delve, unlock, elevate, seamless, journey, game-changer.
${ctaInstruction} Return only the caption text.`

    const captionPromise = geminiText(captionPrompt, { temperature: 0.7, model: 'gemini-2.5-pro' })
      .then((c) => c)
      .catch(() => 'Caption generation was unavailable for this run. Write it in the brand voice: warm, story-first, no hype.')

    const image =
      engine === 'chatgpt'
        ? await openaiImage(imagePrompt, format)
        : await geminiImage(imagePrompt, { aspectRatio: ASPECTS[format] || '1:1' })

    let caption = await captionPromise
    caption = caption.trim()
    if (cta) caption = `${caption} ${cta.trim()}`
    caption = stripDashes(caption)

    return ok(res, {
      dataUrl: `data:${image.mimeType};base64,${image.base64}`,
      caption: caption.trim(),
      engine,
    })
  } catch (err) {
    return fail(res, err.message)
  }
}
