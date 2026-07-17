import { useState } from 'react'
import { Field, Button, Spinner, SourceBadge, ScoreMeter, Toast, useToast, inputCls } from '../components/ui.jsx'
import { runLive } from '../lib/api.js'
import { useHandoff } from '../lib/handoff.js'
import brand from '../../pixar-brand.json'
import goldenBad from '../../data/golden/validate-bad.json'
import goldenGood from '../../data/golden/validate-good.json'

const TYPES = ['Instagram caption', 'Poster tagline', 'Newsletter', 'LinkedIn post', 'YouTube description']
const MAX_CHARS = 4000
const TIERS = brand.story_guard_scoring.tiers
const CATEGORIES = brand.story_guard_scoring.categories.map((c) => c.name)
const DOT_COLORS = ['bg-joy', 'bg-sky', 'bg-ember', 'bg-red']

export default function StoryGuard() {
  const [type, setType] = useState(goldenBad.input.type)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState(goldenBad.input.content)
  const [result, setResult] = useState(goldenBad)
  const [live, setLive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checked, setChecked] = useState({})
  const toast = useToast()

  // Pipeline: captions arrive here from Poster Studio / Screening Room for a check-up.
  useHandoff('/story-guard', (h) => {
    if (!h?.content) return
    setContent(h.content)
    if (h.type) setType(h.type)
    toast.show('Copy received from the pipeline. Hit Validate to screen it.')
  })

  function loadGolden(g) {
    setType(g.input.type)
    setTitle(g.input.title)
    setContent(g.input.content)
    setResult(g)
    setLive(false)
    setChecked({})
  }

  async function validate() {
    setBusy(true)
    const res = await runLive('/api/validate', { type, title, content: content.slice(0, MAX_CHARS) })
    setBusy(false)
    if (res.ok) {
      setResult({ input: { type, title, content }, ...res.data })
      setLive(true)
      setChecked({})
    } else {
      // Cache-first: keep the golden result on any failure, tell the user quietly.
      toast.show(`Live run unavailable (${res.error}). Showing cached result.`)
      setLive(false)
    }
  }

  const tooLong = content.length > MAX_CHARS
  // Honesty guard: the verdict belongs to result.input.content, not the textarea.
  const stale = content.trim() !== (result.input.content || '').trim()
  const hasFeedback = CATEGORIES.some((c) => (result.feedback[c] || []).length > 0)

  const numFixed = Object.values(checked).filter(Boolean).length
  const adjustedCategories = {}
  for (const c of CATEGORIES) {
    const pointers = result.feedback[c] || []
    const original = result.categories[c]
    if (typeof original !== 'number' || !pointers.length) {
      adjustedCategories[c] = original
      continue
    }
    const weight = (100 - original) / pointers.length
    const numChecked = pointers.filter((_, i) => checked[`${c}:${i}`]).length
    adjustedCategories[c] = Math.min(100, Math.round(original + weight * numChecked))
  }
  // Continuous Scaled Difference (CSD) scoring — mirror of api/validate.js, keep in sync.
  const weakest = Math.min(...Object.values(adjustedCategories))
  let adjustedOverall = result.overall
  if (typeof weakest === 'number' && !isNaN(weakest)) {
    if (weakest < 50) {
      adjustedOverall = weakest
    } else {
      let bonus = 0
      Object.values(adjustedCategories).forEach((score) => {
        if (score > weakest) bonus += 0.35 * (score - weakest)
      })
      adjustedOverall = Math.min(100, Math.round(weakest + (weakest / 100) * bonus))
    }
  }

  return (
    <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start fade-up">
      <div className="lg:col-span-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Content type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Title (optional)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Luma opening weekend" />
          </Field>
        </div>
        <div>
          <Field label="Content">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className={`${inputCls} min-h-[320px] lg:min-h-[480px]`}
              placeholder="Paste the post you want to screen…"
            />
          </Field>
          {tooLong && (
            <p className="text-xs text-rose mt-1.5">
              Long one! Only the first {MAX_CHARS.toLocaleString()} characters will be scored.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={validate} disabled={!content.trim() || busy}>
            {busy ? 'Screening…' : 'Validate'}
          </Button>
          <Button variant="soft" onClick={() => loadGolden(goldenBad)} disabled={busy}>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>thumb_down</span>
              Load bad example
            </span>
          </Button>
          <Button variant="soft" onClick={() => loadGolden(goldenGood)} disabled={busy}>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>thumb_up</span>
              Load good example
            </span>
          </Button>
          {busy && <Spinner label="Checking story, claims and slop…" />}
        </div>
        <p className="text-xs text-paper/40">Flags are for human review, not legal advice.</p>
      </div>

      <div className="lg:col-span-7 rounded-2xl bg-panel p-4 sm:p-5 space-y-4 relative overflow-hidden border border-paper/8">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-lamplight/8 blur-2xl" />
        <div className="relative bg-panel-2 rounded-xl border border-paper/8 p-5 sm:p-6 fade-up">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {stale && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ember/15 text-ember text-xs font-semibold px-2.5 py-1">
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>edit</span>
                Unscored edits
              </span>
            )}
            <SourceBadge live={live} />
          </div>

          <div className="flex items-center gap-6">
            <ScoreMeter overall={adjustedOverall} tiers={TIERS} />
          </div>
          {numFixed > 0 && (
            <p className="text-xs text-paper/50 mt-2">
              Estimated score if {numFixed} fix{numFixed === 1 ? ' is' : 'es are'} applied. A projection, not a model score. Re-validate to confirm.
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-paper/10">
            {CATEGORIES.map((c) => {
              const v = adjustedCategories[c]
              const tone = typeof v !== 'number' ? 'text-paper' : v >= 80 ? 'text-teal' : v >= 50 ? 'text-paper' : 'text-rose'
              const severityBorder = typeof v !== 'number' ? 'border-paper/15' : v >= 80 ? 'border-teal' : v >= 50 ? 'border-lamplight' : 'border-rose'
              return (
                <div key={c} className={`border-t-4 pt-2 ${severityBorder}`}>
                  <div className="text-xs text-paper/55">{c}</div>
                  <div className={`text-xl font-semibold font-display mt-0.5 tabular ${tone}`}>{v ?? '-'}</div>
                </div>
              )
            })}
          </div>
        </div>

        {hasFeedback ? (
          <div className="space-y-5">
            {CATEGORIES.map((c, catIndex) =>
              (result.feedback[c] || []).length ? (
                <div key={c}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`h-2 w-2 rounded-full ${DOT_COLORS[catIndex % 4]}`} />
                    <h3 className="text-sm font-semibold text-paper">{c}</h3>
                    <span className="rounded-full bg-paper/8 text-[10px] px-2 py-0.5">{result.feedback[c].length}</span>
                  </div>
                  <div className="space-y-3">
                    {result.feedback[c].map((f, i) => {
                      const key = `${c}:${i}`
                      const isFixed = !!checked[key]
                      return (
                        <div key={i} className={`bg-panel-2 border border-paper/8 rounded-xl p-4 flex gap-3 items-start transition-opacity ${isFixed ? 'opacity-60' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isFixed}
                            onChange={(e) => setChecked((prev) => ({ ...prev, [key]: e.target.checked }))}
                            aria-label="Fixed"
                            className="accent-lamplight mt-1 shrink-0"
                          />
                          <div>
                            <div className={`font-medium text-rose ${isFixed ? 'line-through' : ''}`}>“{f.snippet}”</div>
                            <div className="text-paper/70 text-sm mt-1">{f.problem}</div>
                            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-teal/8 border border-teal/25 px-3 py-2 text-sm text-teal">
                              <span className="material-symbols-outlined mt-0.5" style={{ fontSize: 15 }}>arrow_forward</span>
                              <p>{f.fix}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <p className="text-sm font-medium text-teal inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span>
            Nothing to fix. This one's ready for opening night.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2 text-paper">Original</h3>
            <div className="bg-panel-2 rounded-xl px-4 py-3 text-sm text-paper/70 whitespace-pre-wrap">{result.input.content}</div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2 text-paper">{hasFeedback ? 'On-brand rewrite' : 'Verdict'}</h3>
            <div className="bg-panel-2 rounded-xl px-4 py-3 text-sm border-l-4 border-lamplight whitespace-pre-wrap text-paper/85">{result.rewrite}</div>
          </div>
        </div>
      </div>

      <Toast message={toast.msg} onDone={toast.clear} />
    </div>
  )
}
