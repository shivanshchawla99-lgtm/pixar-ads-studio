import { useState } from 'react'
import { Card, Field, Button, Spinner, SourceBadge, ComingSoonNote, Toast, useToast, inputCls } from '../components/ui.jsx'
import { runLive } from '../lib/api.js'
import { sendTo } from '../lib/handoff.js'
import brand from '../../pixar-brand.json'
import golden from '../../data/golden/audience-lab.json'
import audienceCache from '../../data/audience-cache.json'

const CACHED_FILMS = Object.keys(golden.films)

export default function AudienceLab() {
  const [film, setFilm] = useState(CACHED_FILMS[0])
  const [result, setResult] = useState(golden.films[CACHED_FILMS[0]])
  const [live, setLive] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  function pick(name) {
    setFilm(name)
    setResult(golden.films[name] || null)
    setLive(false)
  }

  async function analyse() {
    setBusy(true)
    const res = await runLive('/api/audience', { film })
    setBusy(false)
    if (res.ok) {
      setResult(res.data)
      setLive(true)
    } else {
      // Cache-first: fall back to the golden analysis for this film.
      setResult(golden.films[film] || null)
      setLive(false)
      toast.show(`Live analysis unavailable (${res.error}). Showing the cached analysis.`)
    }
  }

  const reviewCount = audienceCache.films[film]?.reviews?.length || 0

  return (
    <div className="space-y-6 fade-up relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute bottom-0 -right-28 h-72 w-72 rounded-full bg-sky/10 blur-3xl" />
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-80">
            <Field label="Film">
              <select value={film} onChange={(e) => pick(e.target.value)} className={inputCls}>
                {brand.films.map((f) => (
                  <option key={f.name} value={f.name}>{f.name} ({f.release})</option>
                ))}
              </select>
            </Field>
          </div>
          <Button onClick={analyse} disabled={busy || reviewCount === 0}>
            {busy ? 'Analysing…' : 'Run live analysis'}
          </Button>
          {busy && <Spinner label="Reading what audiences actually said…" />}
          <div className="ml-auto"><SourceBadge live={live} /></div>
        </div>
        {reviewCount > 0 && (
          <p className="text-xs text-ink/45 mt-3 inline-flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden>reviews</span>
            Working from {reviewCount} cached screening note{reviewCount === 1 ? '' : 's'} for this film (demo data).
          </p>
        )}
      </Card>

      {!result ? (
        <Card>
          <div className="text-center py-6">
            <span className="material-symbols-outlined text-ink/25" style={{ fontSize: 36 }} aria-hidden>rate_review</span>
            <p className="text-sm text-ink/70 mt-3 max-w-md mx-auto">
              No screening feedback for <span className="font-semibold">{film}</span> yet, so there's nothing honest to analyse.
              We don't invent audience love.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-5 fade-up relative">
          <div className="rounded-2xl bg-panel-2 border border-sky/20 text-ink p-6 sm:p-7 relative overflow-hidden fade-up">
            <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-sky/10" aria-hidden />
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky/20 text-sky relative z-10" aria-hidden>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>favorite</span>
            </span>
            <div className="relative z-10">
              <div className="text-[11px] uppercase tracking-wider text-sky font-bold mt-4">What audiences love</div>
              <h2 className="font-display font-semibold text-2xl text-ink mt-1">What {film} audiences love</h2>
              <p className="text-ink/85 text-sm mt-2 max-w-2xl">{result.sentiment}</p>
              {result.thin && (
                <p className="rounded-lg bg-ink/10 px-3 py-2 text-xs inline-block mt-3">
                  Sparse feedback for this film, so only what we can actually back up is shown.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-ink/10">
            {result.loves.map((love, i) => (
              <div
                key={`${love.title}-${i}`}
                className="py-6 border-b border-ink/10 px-4 -mx-4 group transition-colors hover:bg-panel fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`rounded-lg h-8 w-8 flex items-center justify-center shrink-0 ${['bg-sky/15', 'bg-lamplight/15', 'bg-teal/15', 'bg-rose/15'][i % 4]}`} aria-hidden>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>favorite</span>
                  </span>
                  <h3 className="font-display font-semibold text-ink text-lg">{love.title}</h3>
                </div>
                <blockquote className={`mt-3 border-l-4 pl-3 italic text-sm text-ink/70 ${['border-sky', 'border-joy-dark', 'border-teal', 'border-rose'][i % 4]}`}>
                  “{love.quote}”
                </blockquote>
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  {love.angles.map((a, j) => (
                    <div key={j} className={`rounded-xl p-4 ${['bg-sky/8', 'bg-lamplight/8', 'bg-teal/8', 'bg-rose/8'][i % 4]}`}>
                      <div className="font-display font-semibold text-sm text-joy-deep">{a.hook}</div>
                      <div className="text-sm text-ink/75 mt-1.5">{a.primary_text}</div>
                      <div className="inline-flex items-start gap-1.5 text-xs text-ink/50 mt-2.5">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }} aria-hidden>image</span>
                        <span>{a.visual}</span>
                      </div>
                      <button
                        onClick={() => sendTo('/poster', { brief: `${a.hook} ${a.primary_text}`, film, imagery: a.visual, cta: '' })}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-joy-deep hover:underline cursor-pointer"
                      >
                        Send to Poster Studio
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>east</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 relative">
        <ComingSoonNote icon="link" hint="Coming soon: live sources">Connect live social listening and review feeds per territory.</ComingSoonNote>
        <ComingSoonNote icon="sync" hint="Alerts on sentiment shifts">Auto-sync feedback weekly and alert on sentiment shifts.</ComingSoonNote>
      </div>

      <Toast message={toast.msg} onDone={toast.clear} />
    </div>
  )
}
