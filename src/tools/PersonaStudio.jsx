import { useState } from 'react'
import { Card, Field, Button, Spinner, SourceBadge, Toast, useToast, inputCls, ACCENTS } from '../components/ui.jsx'
import { runLive } from '../lib/api.js'
import { sendTo } from '../lib/handoff.js'
import brand from '../../pixar-brand.json'
import golden from '../../data/golden/personas.json'

export default function PersonaStudio() {
  const FILMS = brand.films.map((f) => f.name)
  const [film, setFilm] = useState(FILMS[0])
  const [result, setResult] = useState(golden.films[FILMS[0]])
  const [live, setLive] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  function pick(name) {
    setFilm(name)
    setResult(golden.films[name] || null)
    setLive(false)
  }

  async function generate() {
    setBusy(true)
    const res = await runLive('/api/personas', { film })
    setBusy(false)
    if (res.ok && Array.isArray(res.data.personas)) {
      setResult(res.data)
      setLive(true)
    } else {
      setResult(golden.films[film] || null)
      setLive(false)
      toast.show(`Live personas unavailable (${res.error}). Showing the cached set.`)
    }
  }

  return (
    <div className="space-y-6 fade-up relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet/12 blur-3xl" />
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-80">
            <Field label="Film">
              <select value={film} onChange={(e) => pick(e.target.value)} className={inputCls}>
                {FILMS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <Button onClick={generate} disabled={busy}>{busy ? 'Building…' : 'Rebuild personas'}</Button>
          {busy && <Spinner label="Turning audience signals into people…" />}
          <div className="ml-auto"><SourceBadge live={live} /></div>
        </div>
        <p className="text-xs text-ink/45 mt-3">
          Personas are grounded in Audience Lab signals and the brand file's audience section. Every persona cites the signal it grew from.
        </p>
      </Card>

      {!result?.personas?.length ? (
        <Card>
          <p className="text-sm text-ink/70 text-center py-6">No personas yet for {film}.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {result.personas.map((p, i) => {
            const accent = ACCENTS[i % ACCENTS.length]
            return (
              <div key={p.name} className={`rounded-2xl bg-panel border border-ink/8 border-t-4 ${accent.border} p-5 flex flex-col gap-3 fade-up`} style={{ animationDelay: `${i * 60}ms` }}>
                <div>
                  <h3 className="font-display font-semibold text-lg text-ink">{p.name}</h3>
                  <p className={`text-xs font-semibold mt-0.5 ${accent.text}`}>{p.segment}</p>
                </div>
                <blockquote className="text-xs italic text-ink/60 border-l-2 border-ink/20 pl-2.5">
                  Grew from: “{p.quote_basis}”
                </blockquote>
                <dl className="text-sm space-y-2">
                  <div><dt className="text-ink/45 text-xs font-semibold uppercase tracking-wide">Wants</dt><dd className="text-ink/80">{p.wants}</dd></div>
                  <div><dt className="text-ink/45 text-xs font-semibold uppercase tracking-wide">Fears</dt><dd className="text-ink/80">{p.fears}</dd></div>
                  <div><dt className="text-ink/45 text-xs font-semibold uppercase tracking-wide">Where they live online</dt><dd className="text-ink/80">{p.media}</dd></div>
                  <div><dt className="text-ink/45 text-xs font-semibold uppercase tracking-wide">Targeting notes</dt><dd className="text-ink/80">{p.targeting}</dd></div>
                </dl>
                <div className="mt-auto pt-2 border-t border-ink/8">
                  <div className="text-xs font-semibold text-ink/45 uppercase tracking-wide mb-1.5">Hooks that work</div>
                  <div className="space-y-1.5">
                    {(p.winning_hooks || []).map((h) => (
                      <div key={h} className={`text-sm font-display font-medium rounded-lg px-3 py-2 ${accent.bg} ${accent.text}`}>“{h}”</div>
                    ))}
                  </div>
                  <button
                    onClick={() => sendTo('/screening', { brief: `${film} ad for ${p.name} (${p.segment}). They want: ${p.wants}`, film, audience: `${p.name}, ${p.segment}` })}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline cursor-pointer"
                  >
                    Test ad variants for this persona
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>east</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Toast message={toast.msg} onDone={toast.clear} />
    </div>
  )
}
