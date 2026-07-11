import { useState } from 'react'
import { Card, Field, Button, Spinner, SourceBadge, Toast, useToast, inputCls } from '../components/ui.jsx'
import { runLive } from '../lib/api.js'
import { useHandoff, sendTo } from '../lib/handoff.js'
import brand from '../../pixar-brand.json'
import golden from '../../data/golden/variants.json'

const CATEGORIES = brand.story_guard_scoring.categories.map((c) => c.name)

export default function ScreeningRoom() {
  const FILMS = brand.films.map((f) => f.name)
  const [film, setFilm] = useState(golden.input.film)
  const [brief, setBrief] = useState(golden.input.brief)
  const [audience, setAudience] = useState(golden.input.audience)
  const [variants, setVariants] = useState(golden.variants)
  const [live, setLive] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  // Pipeline: briefs arrive from Persona Studio and Spark Engine.
  useHandoff('/screening', (h) => {
    if (!h?.brief) return
    setBrief(h.brief)
    if (h.film && FILMS.includes(h.film)) setFilm(h.film)
    if (h.audience) setAudience(h.audience)
    toast.show('Brief received from the pipeline. Run the screening when ready.')
  })

  async function screen() {
    setBusy(true)
    const res = await runLive('/api/variants', { film, brief, audience })
    setBusy(false)
    if (res.ok && Array.isArray(res.data.variants) && res.data.variants.length) {
      setVariants(res.data.variants)
      setLive(true)
    } else {
      setVariants(golden.variants)
      setLive(false)
      toast.show(`Live screening unavailable (${res.error}). Showing the cached screening.`)
    }
  }

  const winner = variants.find((v) => v.winner)

  return (
    <div className="space-y-6 fade-up relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal/10 blur-3xl" />
      <Card>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Film">
            <select value={film} onChange={(e) => setFilm(e.target.value)} className={inputCls}>
              {FILMS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Brief">
              <input value={brief} onChange={(e) => setBrief(e.target.value)} className={inputCls} placeholder="What is this ad trying to do, and for whom?" />
            </Field>
          </div>
        </div>
        <div className="mt-3 grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Audience (optional)">
            <input value={audience} onChange={(e) => setAudience(e.target.value)} className={inputCls} placeholder="e.g. a persona from Persona Studio" />
          </Field>
          <Button onClick={screen} disabled={busy || !brief.trim()}>{busy ? 'Screening…' : 'Run the screening'}</Button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-paper/45">Four variants, each scored by Story Guard's rules. The weakest category drags the total, exactly like the real screening.</p>
          <SourceBadge live={live} />
        </div>
        {busy && <div className="mt-3"><Spinner label="Writing four contenders and scoring them…" /></div>}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {variants.map((v, i) => (
          <div
            key={i}
            className={`rounded-2xl p-5 border fade-up ${v.winner ? 'bg-panel-2 border-lamplight/60 shadow-[0_0_30px_rgba(255,200,61,0.12)]' : 'bg-panel border-paper/8'}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-display font-semibold text-lg text-paper leading-snug">“{v.hook}”</div>
              {v.winner ? (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-lamplight text-midnight text-xs font-bold px-2.5 py-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>trophy</span>
                  Winner
                </span>
              ) : (
                <span className="shrink-0 text-2xl font-display font-bold text-paper/35 tabular">{v.overall}</span>
              )}
            </div>
            <p className="text-sm text-paper/75 mt-2">{v.primary_text}</p>
            <span className="mt-3 inline-block rounded-full border border-paper/20 text-paper/70 text-xs font-semibold px-3 py-1">{v.cta}</span>
            <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-paper/8">
              {CATEGORIES.map((c) => {
                const s = v.scores?.[c]
                const tone = typeof s !== 'number' ? 'text-paper/40' : s >= 80 ? 'text-teal' : s >= 50 ? 'text-lamplight' : 'text-rose'
                return (
                  <div key={c}>
                    <div className="text-[10px] text-paper/45 leading-tight">{c}</div>
                    <div className={`text-sm font-semibold tabular ${tone}`}>{s ?? '-'}</div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-paper/55 mt-3 italic">{v.verdict}</p>
            {v.winner && (
              <div className="mt-3 flex flex-wrap gap-4">
                <button
                  onClick={() => sendTo('/poster', { brief: `${v.hook} ${v.primary_text}`, film, cta: v.cta })}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-lamplight hover:underline cursor-pointer"
                >
                  Make the poster
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>east</span>
                </button>
                <button
                  onClick={() => sendTo('/story-guard', { content: `${v.hook} ${v.primary_text} ${v.cta}`, type: 'Instagram caption' })}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose hover:underline cursor-pointer"
                >
                  Full check in Story Guard
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>east</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {winner && (
        <p className="text-xs text-paper/45">
          Winner picked on scores alone. The low scorer stays on screen on purpose: seeing why it lost is half the tool.
        </p>
      )}

      <Toast message={toast.msg} onDone={toast.clear} />
    </div>
  )
}
