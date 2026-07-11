import { useState } from 'react'
import { Button, Spinner, SourceBadge, ComingSoonNote, Toast, useToast, ACCENTS } from '../components/ui.jsx'
import { runLive } from '../lib/api.js'
import { sendTo } from '../lib/handoff.js'
import golden from '../../data/golden/ideas.json'

const QUOTE_BORDERS = ['border-l-lamplight', 'border-l-sky', 'border-l-teal', 'border-l-rose']

export default function SparkEngine() {
  const [ideas, setIdeas] = useState(golden.ideas)
  const [live, setLive] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  async function refresh() {
    setBusy(true)
    const res = await runLive('/api/ideas', {})
    setBusy(false)
    if (res.ok && Array.isArray(res.data.ideas) && res.data.ideas.length) {
      setIdeas(res.data.ideas)
      setLive(true)
    } else {
      // Cache-first: keep the golden list, mention it quietly.
      setIdeas(golden.ideas)
      setLive(false)
      toast.show(`Fresh sparks unavailable (${res.error}). Showing the cached set.`)
    }
  }

  return (
    <div className="space-y-6 fade-up relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-lamplight/8 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/2 -left-32 h-64 w-64 rounded-full bg-violet/10 blur-3xl" />
      <div className="min-w-0 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button onClick={refresh} disabled={busy}>{busy ? 'Sparking…' : 'Refresh sparks'}</Button>
            {busy && <Spinner label="Reading the brand file and audience notes…" />}
          </div>
          <SourceBadge live={live} />
        </div>

        <div className="border-t border-paper/10">
          {ideas.map((idea, i) => {
            const accent = ACCENTS[i % ACCENTS.length]
            return (
              <div
                key={`${idea.title}-${i}`}
                style={{ animationDelay: `${i * 40}ms` }}
                className="fade-up py-5 border-b border-paper/10 px-4 -mx-4 rounded-none group cursor-default transition-colors hover:bg-panel"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="flex-1 min-w-0 font-display font-semibold text-paper text-lg group-hover:text-lamplight transition-colors">
                    {idea.title}
                    {idea.film && <span className="ml-2 text-xs font-sans font-semibold text-paper/45">{idea.film}</span>}
                  </h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${accent.bg} ${accent.text}`}>
                    {idea.channel}
                  </span>
                </div>
                {idea.why_it_matters && (
                  <p className="text-sm text-paper/70 mt-3">
                    <span className={`font-semibold ${accent.text}`}>Why it matters: </span>{idea.why_it_matters}
                  </p>
                )}
                <p className="text-sm text-paper/70 mt-2">
                  <span className={`font-semibold ${accent.text}`}>The angle: </span>{idea.angle}
                </p>
                <div className={`mt-3 pl-4 border-l-2 ${QUOTE_BORDERS[i % QUOTE_BORDERS.length]} bg-panel group-hover:bg-panel-2 py-2 pr-2 text-sm italic font-medium text-paper/80 rounded-r-lg`}>
                  “{idea.hook}”
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => sendTo('/poster', { brief: `${idea.title}: ${idea.angle}`, film: idea.film || '', cta: '' })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-lamplight hover:underline cursor-pointer"
                  >
                    Send to Poster Studio
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>east</span>
                  </button>
                  <button
                    onClick={() => sendTo('/screening', { brief: `${idea.title}: ${idea.angle}`, film: idea.film || '' })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal hover:underline cursor-pointer"
                  >
                    Test variants in Screening Room
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>east</span>
                  </button>
                  {idea.source && <span className="text-xs text-paper/40">Grounded in: {idea.source}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 relative">
        <ComingSoonNote icon="auto_awesome" hint="Coming soon across the whole slate">Automate weekly sparks per film and channel.</ComingSoonNote>
        <ComingSoonNote icon="query_stats" hint="Feed ad results back in">"What won": paste campaign results to rank future sparks.</ComingSoonNote>
      </div>

      <Toast message={toast.msg} onDone={toast.clear} />
    </div>
  )
}
