import { useState, useEffect } from 'react'
import { Field, Button, Spinner, SourceBadge, EngineBadge, Toast, useToast, inputCls } from '../components/ui.jsx'
import { runLive } from '../lib/api.js'
import { useHandoff, sendTo } from '../lib/handoff.js'
import brand from '../../pixar-brand.json'
import golden from '../../data/golden/creative.json'

const PLATFORMS = ['', 'Instagram post', 'Instagram story', 'Facebook ad', 'LinkedIn post', 'Cinema lobby screen']

// Maps to the JSON brief's accent_colours. 'auto' lets the model pick 1-2 on brand.
const ACCENT_OPTIONS = ['auto', 'joy yellow', 'brave ember', 'oceanic blue', 'soulful purple']

// Fixed display order for the template gallery groups.
const CATEGORIES = ['Story-first launches', 'Family weekend pushes', 'Grown-up angles']

const SIZE_PX = { '1080x1080': [1080, 1080], '1080x1920': [1080, 1920], '1200x628': [1200, 628] }
// Force the model output to the exact requested pixels. Contain-fit on midnight
// (brand background is midnight) so nothing is cropped and both engines match.
function normalizeToSize(dataUrl, format) {
  return new Promise((resolve) => {
    const [w, h] = SIZE_PX[format] || [1080, 1080]
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, w, h)
      const scale = Math.min(w / img.width, h / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

const DEFAULT_FORM = {
  brief: 'A warm opening-weekend post inviting families to see Luma',
  format: '1080x1080',
  film: 'Luma',
  offer: 'Family tickets at participating cinemas',
  mood: 'wondrous and warm',
  accent: 'auto',
  platform: '',
  audience: '',
  cta: '',
  layout: '',
  imagery: '',
}

export default function PosterStudio() {
  // Only the form + engine are persisted; generated images are too large for
  // sessionStorage quota, so results reset to the golden creative on reload.
  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem('poster_studio_form')
      if (saved) return { ...DEFAULT_FORM, ...JSON.parse(saved) }
    } catch { /* fall through */ }
    return DEFAULT_FORM
  })
  const [engine, setEngine] = useState(() => {
    try { return sessionStorage.getItem('poster_studio_engine') || 'gemini' } catch { return 'gemini' }
  })
  // results: array of { engine, image, caption, golden } — one for single runs, two in compare mode
  const [results, setResults] = useState([{ engine: 'Pre-approved', ...golden.creatives[0], golden: true }])
  const [goldenIdx, setGoldenIdx] = useState(0)
  const [live, setLive] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    try {
      sessionStorage.setItem('poster_studio_form', JSON.stringify(form))
      sessionStorage.setItem('poster_studio_engine', engine)
    } catch { /* quota: persistence is best-effort */ }
  }, [form, engine])

  // Pipeline: briefs arrive from Audience Lab, Spark Engine and Screening Room.
  useHandoff('/poster', (h) => {
    if (!h?.brief) return
    setForm((f) => ({
      ...f,
      brief: h.brief,
      film: h.film && brand.films.some((x) => x.name === h.film) ? h.film : f.film,
      cta: h.cta ?? f.cta,
      imagery: h.imagery ?? f.imagery,
    }))
    toast.show('Brief received from the pipeline. Generate when ready.')
  })

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  function fallbackToGolden(message) {
    const next = (goldenIdx + 1) % golden.creatives.length
    setGoldenIdx(next)
    setResults([{ engine: 'Pre-approved', ...golden.creatives[next], golden: true }])
    setLive(false)
    toast.show(message)
  }

  async function generate() {
    setBusy(true)
    const res = await runLive('/api/creative', { ...form, engine })
    setBusy(false)
    if (res.ok) {
      const image = await normalizeToSize(res.data.dataUrl, form.format)
      setResults([{ engine: engine === 'chatgpt' ? 'ChatGPT' : 'Gemini', image, caption: res.data.caption }])
      setLive(true)
    } else {
      fallbackToGolden(`Live generation unavailable (${res.error}). Showing a pre-approved creative.`)
    }
  }

  async function compare() {
    setBusy(true)
    const [gem, gpt] = await Promise.all([
      runLive('/api/creative', { ...form, engine: 'gemini' }),
      runLive('/api/creative', { ...form, engine: 'chatgpt' }),
    ])
    setBusy(false)
    const out = []
    if (gem.ok) out.push({ engine: 'Gemini', image: await normalizeToSize(gem.data.dataUrl, form.format), caption: gem.data.caption })
    if (gpt.ok) out.push({ engine: 'ChatGPT', image: await normalizeToSize(gpt.data.dataUrl, form.format), caption: gpt.data.caption })
    if (!out.length) {
      fallbackToGolden(`Neither engine responded (${gem.error}). Showing a pre-approved creative.`)
      return
    }
    if (!gpt.ok) toast.show(`ChatGPT side unavailable (${gpt.error}). Showing Gemini only.`)
    else if (!gem.ok) toast.show(`Gemini side unavailable (${gem.error}). Showing ChatGPT only.`)
    setResults(out)
    setLive(true)
  }

  function download(item) {
    const a = document.createElement('a')
    a.href = item.image
    a.download = item.golden ? 'pixar-ads-creative.png' : `pixar-ads-creative-${item.engine.toLowerCase()}.png`
    a.click()
  }

  // Gallery click loads the preset into the workspace instead of ejecting to a raw file.
  function loadPreset(c) {
    setForm((f) => ({ ...f, brief: c.headline, film: c.film || f.film, offer: '' }))
    setResults([{ engine: 'Pre-approved', image: c.image, caption: c.caption, golden: true }])
    setLive(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="grid lg:grid-cols-2 items-start fade-up min-h-full">
      <section className="bg-panel lg:border-r border-paper/8 p-5 sm:p-8 h-full">
        <div className="space-y-4 max-w-xl">
          <Field label="Brief">
            <textarea value={form.brief} onChange={set('brief')} rows={3} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format">
              <select value={form.format} onChange={set('format')} className={inputCls}>
                <option value="1080x1080">1080 x 1080</option>
                <option value="1080x1920">1080 x 1920</option>
                <option value="1200x628">1200 x 628</option>
              </select>
            </Field>
            <Field label="Platform (optional)">
              <select value={form.platform} onChange={set('platform')} className={inputCls}>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p || 'Any'}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Film">
            <select value={form.film} onChange={set('film')} className={inputCls}>
              <option value="">Whole slate</option>
              {brand.films.map((f) => (
                <option key={f.name} value={f.name}>{f.name} ({f.release})</option>
              ))}
            </select>
          </Field>
          <Field label="Offer">
            <input value={form.offer} onChange={set('offer')} className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mood">
              <input value={form.mood} onChange={set('mood')} className={inputCls} />
            </Field>
            <Field label="Accent colour">
              <select value={form.accent} onChange={set('accent')} className={inputCls}>
                {ACCENT_OPTIONS.map((a) => (
                  <option key={a} value={a}>{a === 'auto' ? 'Auto (AI picks)' : a}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target audience (optional)">
              <input value={form.audience} onChange={set('audience')} className={inputCls} placeholder="e.g. Weekend Planner Priya" />
            </Field>
            <Field label="Call to action (optional)">
              <input value={form.cta} onChange={set('cta')} className={inputCls} placeholder="e.g. Get family tickets" />
            </Field>
          </div>
          <Field label="Layout notes (optional)">
            <input value={form.layout} onChange={set('layout')} className={inputCls} placeholder="e.g. headline top-left, motif lower right" />
          </Field>
          <Field label="Imagery idea (optional)">
            <input value={form.imagery} onChange={set('imagery')} className={inputCls} placeholder="e.g. one warm light over a dark field" />
          </Field>
          <Field label="Engine">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEngine('gemini')}
                className={`rounded-full px-4 py-2 text-sm font-medium border cursor-pointer transition-colors ${engine === 'gemini' ? 'border-teal/40 bg-teal/12 text-teal' : 'border-paper/15 text-paper/60 hover:bg-paper/5'}`}
              >
                Gemini
              </button>
              <button
                onClick={() => setEngine('chatgpt')}
                className={`rounded-full px-4 py-2 text-sm font-medium border cursor-pointer transition-colors ${engine === 'chatgpt' ? 'border-sky/40 bg-sky/12 text-sky' : 'border-paper/15 text-paper/60 hover:bg-paper/5'}`}
                title="Needs OPENAI_API_KEY on the server"
              >
                ChatGPT
              </button>
            </div>
          </Field>
          <div className="flex gap-3 pt-1">
            <Button onClick={generate} disabled={busy} className="flex-1">
              {busy ? 'Generating…' : 'Generate'}
            </Button>
            <Button variant="soft" onClick={compare} disabled={busy} className="flex-1 whitespace-nowrap">
              Compare engines
            </Button>
          </div>
          {busy && <Spinner label="Mixing midnight and lamplight, keeping characters on-model…" />}
          <p className="text-xs text-paper/45 leading-relaxed">
            Layout, wordmark and palette are locked. AI fills the safe slots only: never off-model characters, never invented quotes or laurels.
          </p>
        </div>
      </section>

      <section className="relative bg-midnight starfield p-5 sm:p-8 h-full min-h-[500px] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-lamplight/8 blur-2xl" />
        <div className="absolute top-5 right-5 z-10">
          <SourceBadge live={live} />
        </div>
        <div className={`relative ${results.length > 1 ? 'grid md:grid-cols-2 gap-4 mt-8' : 'mt-8 max-w-xl mx-auto'}`}>
          {results.map((item, i) => (
            <div key={i} className="bg-panel p-3 rounded-2xl shadow-lg border border-paper/8 relative fade-up">
              <div className="absolute top-6 left-6 z-10 rounded-full bg-midnight/90 shadow-sm">
                <EngineBadge name={item.engine} status="ready" />
              </div>
              <img src={item.image} alt={`${item.engine} creative`} className="w-full rounded-xl border border-paper/5 bg-midnight" />
              <div className="mt-3 rounded-xl bg-panel-2 border border-paper/10 px-4 py-3 text-sm whitespace-pre-wrap text-paper/85">{item.caption}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={() => download(item)}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                    Download
                  </span>
                </Button>
                <button
                  onClick={() => sendTo('/story-guard', { content: item.caption, type: 'Instagram caption' })}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-rose hover:underline cursor-pointer"
                >
                  Check in Story Guard
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>east</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lg:col-span-2 bg-panel border-t border-paper/8 p-5 sm:p-8">
        <h2 className="text-lg font-semibold text-paper mb-1">Sample gallery</h2>
        <p className="text-xs text-paper/45 mb-4">Click any card to load it into the workspace.</p>
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const items = golden.creatives.filter((c) => c.category === cat)
            if (!items.length) return null
            return (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-paper/60 mb-3">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {items.map((c, i) => (
                    <button
                      key={`${cat}-${i}`}
                      onClick={() => loadPreset(c)}
                      className="group text-left bg-panel-2 rounded-2xl border border-paper/8 overflow-hidden shadow-sm hover:shadow-md hover:border-lamplight/30 transition-[box-shadow,border-color] cursor-pointer"
                    >
                      <div className="relative aspect-square bg-midnight">
                        <img
                          src={c.image}
                          alt={c.headline}
                          className="h-full w-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-midnight/60 transition-opacity">
                          <span className="rounded-full bg-lamplight text-midnight text-sm font-semibold px-4 py-2">Load into workspace</span>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-paper line-clamp-2">{c.headline}</p>
                        <span className="mt-2 inline-block rounded-full bg-lamplight/12 text-lamplight text-xs font-semibold px-2.5 py-1">{c.film}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <Toast message={toast.msg} onDone={toast.clear} />
    </div>
  )
}
