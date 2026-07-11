import { useEffect, useRef, useState } from 'react'
import ideasData from '../data/golden/ideas.json'
import audienceData from '../data/golden/audience-lab.json'
import variantsData from '../data/golden/variants.json'

function Icon({ name, size = 18 }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size }} aria-hidden>
      {name}
    </span>
  )
}

// The pipeline, in narrative order. Honest copy only: every line below is
// something the deployed tool actually does today.
const STAGES = [
  {
    path: '/audience', name: 'Audience Lab', icon: 'theater_comedy', accent: 'text-sky', bg: 'bg-sky/12',
    blurb: 'Reads cached audience feedback per film and turns what people actually said into themes, verbatim quotes, and ready ad angles.',
  },
  {
    path: '/personas', name: 'Persona Studio', icon: 'groups', accent: 'text-violet', bg: 'bg-violet/15',
    blurb: 'Grows living personas out of those signals: wants, fears, media habits, the hooks that work, and targeting notes. Every persona cites its source quote.',
  },
  {
    path: '/sparks', name: 'Spark Engine', icon: 'lightbulb', accent: 'text-lamplight', bg: 'bg-lamplight/12',
    blurb: 'An always-on list of story-first campaign ideas grounded in the brand file and audience signals, each one a click away from production.',
  },
  {
    path: '/poster', name: 'Poster Studio', icon: 'palette', accent: 'text-ember', bg: 'bg-ember/12',
    blurb: 'Generates posters and social creatives with the risky parts locked: palette, type and wordmark fixed, characters never invented off-model.',
  },
  {
    path: '/screening', name: 'Screening Room', icon: 'movie_filter', accent: 'text-teal', bg: 'bg-teal/12',
    blurb: 'Writes four ad variants for one brief and scores them head-to-head against the brand rules. The winner earns the poster.',
  },
  {
    path: '/story-guard', name: 'Story Guard', icon: 'security', accent: 'text-rose', bg: 'bg-rose/12',
    blurb: 'Screens any copy against story, claims, voice and no-slop rules. Categorized fixes, an honest score, and an on-brand rewrite.',
  },
]

function ScoreDemo() {
  const numRef = useRef(null)
  const [phase, setPhase] = useState('bad')
  const wrapRef = useRef(null)
  const played = useRef(false)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || played.current) return
        played.current = true
        if (reduce) {
          if (numRef.current) numRef.current.textContent = '94'
          setPhase('good')
          return
        }
        const start = performance.now()
        const dur = 2000
        let raf = 0
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur)
          const eased = 1 - Math.pow(1 - t, 3)
          const val = Math.round(8 + (94 - 8) * eased)
          if (numRef.current) numRef.current.textContent = String(val)
          if (val >= 60) setPhase('good')
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        const timeoutId = setTimeout(() => { raf = requestAnimationFrame(tick) }, 500)
        io._cleanup = () => { clearTimeout(timeoutId); cancelAnimationFrame(raf) }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => { io.disconnect(); if (io._cleanup) io._cleanup() }
  }, [])

  return (
    <div ref={wrapRef} className="rounded-3xl bg-panel border border-paper/10 shadow-xl p-7 w-full max-w-sm mx-auto">
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 shrink-0">
          <img src="/scores/dvd.svg" alt="" className={`absolute inset-0 h-24 w-24 object-contain transition-[opacity,filter] duration-500 ${phase === 'bad' ? 'opacity-100' : 'opacity-0 blur-sm'}`} />
          <img src="/scores/gold.svg" alt="Gold star badge" className={`absolute inset-0 h-24 w-24 object-contain transition-[opacity,filter] duration-500 ${phase === 'good' ? 'opacity-100' : 'opacity-0 blur-sm'}`} />
        </div>
        <div>
          <div>
            <span ref={numRef} className="font-display font-bold text-6xl tabular text-paper">8</span>
            <span className="text-paper/40 text-lg font-semibold">/100</span>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors inline-block mt-2 ${phase === 'good' ? 'bg-lamplight/15 text-lamplight' : 'bg-rose/15 text-rose'}`}>
            {phase === 'good' ? 'Box Office Gold' : 'Straight to DVD'}
          </span>
        </div>
      </div>
      <p className="text-xs text-paper/50 mt-4">The same caption, before and after the fixes. Real scores from Story Guard.</p>
    </div>
  )
}

function HookTicker() {
  const ideas = ideasData.ideas.slice(0, 4)
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % ideas.length), 3200)
    return () => clearInterval(id)
  }, [ideas.length])
  return (
    <div className="rounded-3xl bg-panel border border-paper/10 shadow-xl p-6">
      <span className="text-xs font-semibold text-paper/45">Hooks it wrote from the brand file</span>
      <p key={i} className="fade-up font-display font-semibold text-xl md:text-2xl text-paper leading-snug mt-3 min-h-[6rem]">
        &ldquo;{ideas[i].hook}&rdquo;
      </p>
      <span className="rounded-full bg-lamplight/15 text-lamplight text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 inline-block mt-3">
        {ideas[i].channel}
      </span>
      <div className="flex gap-1 mt-5">
        {ideas.map((idea, n) => (
          <span key={idea.title} className={`h-1 rounded-full flex-1 ${n === i ? 'bg-lamplight' : 'bg-paper/15'}`} />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1300)
    return () => clearTimeout(t)
  }, [])

  const luma = audienceData.films['Luma']
  const love = luma.loves[0]
  const angle = love.angles[0]
  const winner = variantsData.variants.find((v) => v.winner)

  const headline = 'Ads with the heart of a great film.'
  const words = headline.split(' ')

  return (
    <div className="bg-midnight min-h-screen text-paper">
      {/* Projector-beam intro */}
      {!introDone && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden bg-midnight iris-in" aria-hidden>
          <div className="beam absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-lamplight/25 to-transparent" />
        </div>
      )}

      {/* Nav */}
      <header className="absolute top-0 inset-x-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-xl text-paper">Pixar <span className="text-lamplight">Ads</span> Studio</span>
            <span className="text-[10px] text-paper/40 hidden sm:inline">unofficial concept</span>
          </div>
          <a
            href="#/audience"
            className="bg-lamplight text-midnight rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-lamplight-dark transition-[background-color,transform] duration-150 active:scale-[0.97] inline-flex items-center gap-1.5"
          >
            Open the studio
            <Icon name="arrow_forward" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden starfield">
        <div className="absolute rounded-full bg-lamplight/10 h-80 w-80 blur-3xl left-1/2 top-1/3 pointer-events-none" aria-hidden />
        <span className="absolute top-[18%] right-[12%] text-lamplight twinkle pointer-events-none hidden md:block" aria-hidden><Icon name="star" size={22} /></span>
        <span className="absolute bottom-[20%] left-[8%] text-sky twinkle pointer-events-none hidden md:block" style={{ animationDelay: '1.2s' }} aria-hidden><Icon name="star" size={16} /></span>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center relative w-full pt-16">
          <div>
            <p className="fade-up text-lamplight text-sm font-semibold tracking-wide uppercase" style={{ animationDelay: '250ms' }}>
              Analyse your audience. Build winning ads.
            </p>
            <h1 className="font-display font-semibold text-4xl md:text-5xl xl:text-6xl tracking-tight leading-[1.08] text-paper mt-4">
              {words.map((word, i) => {
                const glow = word === 'heart'
                return (
                  <span key={i}>
                    <span className={`word-up ${glow ? 'animate-lamplight' : ''}`} style={{ animationDelay: `${400 + i * 70}ms` }}>
                      {word}
                    </span>{' '}
                  </span>
                )
              })}
            </h1>
            <p className="fade-up text-paper/65 mt-5 max-w-[46ch] leading-relaxed" style={{ animationDelay: '1050ms' }}>
              Six tools, one brand file, one pipeline: audience insight becomes personas, personas become ideas,
              ideas become creatives, and nothing ships without a screening.
            </p>
            <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: '1250ms' }}>
              <a
                href="#/audience"
                className="bg-lamplight text-midnight rounded-xl px-5 py-3 text-sm font-semibold hover:bg-lamplight-dark transition-colors inline-flex items-center gap-1.5"
              >
                Start with the audience
                <Icon name="arrow_forward" />
              </a>
              <button
                type="button"
                onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
                className="border border-paper/20 text-paper rounded-xl px-5 py-3 text-sm font-semibold hover:bg-panel transition-colors inline-flex items-center gap-1.5"
              >
                See the pipeline
                <Icon name="arrow_downward" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-panel border border-paper/10 p-5 shadow-2xl shadow-black/40 rotate-1">
              <img src="/golden/luma-hero.svg" alt="Luma concept poster made in Poster Studio" className="w-full rounded-2xl" loading="eager" />
              <p className="text-lamplight/80 text-xs mt-4">Made in Poster Studio. Locked palette, locked type, zero off-model art.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="relative border-t border-paper/8 bg-panel/40">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-paper text-center">From what audiences say to ads that win</h2>
          <p className="text-paper/60 text-center mt-3 max-w-2xl mx-auto">
            Every tool hands off to the next. Follow one thread: a screening note becomes a persona, a hook, a scored winner, a poster.
          </p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-12">
            {STAGES.map((s, i) => (
              <a
                key={s.path}
                href={`#${s.path}`}
                className="group rounded-2xl bg-panel border border-paper/8 p-6 hover:border-lamplight/40 hover:-translate-y-0.5 transition-[border-color,transform] duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-10 w-10 rounded-xl ${s.bg} ${s.accent} flex items-center justify-center`}>
                    <Icon name={s.icon} size={22} />
                  </span>
                  <span className="text-paper/30 font-display font-bold text-sm">0{i + 1}</span>
                  <h3 className="font-display font-semibold text-lg text-paper group-hover:text-lamplight transition-colors">{s.name}</h3>
                </div>
                <p className="text-sm text-paper/65 mt-3 leading-relaxed">{s.blurb}</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold mt-4 ${s.accent}`}>
                  Open <Icon name="east" size={14} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* One thread, followed */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-paper">Audiences already wrote the ads</h2>
          <p className="text-paper/65 mt-4 max-w-[52ch] leading-relaxed">
            A parent said their daughter left the screening asking for a firefly nightlight.
            Audience Lab caught it, Persona Studio named her, Screening Room scored four ways to say it,
            and the winner became the poster.
          </p>
          <div className="mt-6 space-y-3">
            <div className="bg-panel rounded-2xl border border-paper/10 p-5">
              <span className="text-xs font-semibold text-sky">A real screening note (demo data)</span>
              <blockquote className="mt-2 italic text-paper/75 leading-relaxed text-sm">“{love.quote}”</blockquote>
            </div>
            <div className="text-center text-paper/40"><Icon name="south" size={24} /></div>
            <div className="bg-panel-2 rounded-2xl border border-lamplight/30 p-5">
              <span className="text-xs font-semibold text-lamplight">becomes the winning ad</span>
              <p className="font-display font-semibold text-lg mt-2 text-paper">{winner.hook}</p>
              <p className="text-paper/75 text-sm mt-1.5">{winner.primary_text}</p>
              <span className="mt-3 inline-block rounded-full bg-lamplight/15 text-lamplight text-xs font-semibold px-3 py-1">Scored {winner.overall}/100 in Screening Room</span>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <HookTicker />
          <ScoreDemo />
        </div>
      </section>

      {/* Closing band */}
      <section className="relative bg-panel border-t border-paper/8 overflow-hidden">
        <div className="border-b border-paper/10 py-4 overflow-hidden whitespace-nowrap">
          <div className="marquee-track inline-flex gap-10 items-center will-change-transform">
            {[...Array(2)].flatMap((_, r) => [
              <span key={`a${r}`} className="font-display font-semibold text-lg text-paper/70">Every ad should feel like the first ten minutes of a great film.</span>,
              <span key={`b${r}`} className="font-display font-semibold text-lg text-lamplight">story first</span>,
              <span key={`c${r}`} className="font-display font-semibold text-lg text-paper/70">One brand file under every tool.</span>,
              <span key={`d${r}`} className="font-display font-semibold text-lg text-sky">no slop, ever</span>,
            ])}
          </div>
        </div>

        <div className="px-6 py-24 text-center max-w-3xl mx-auto">
          <h2 className="font-display font-semibold text-3xl md:text-5xl text-paper">One brand file under every tool.</h2>
          <p className="mt-5 text-paper/65 text-lg">
            Change the voice, a rule or a colour once and all six tools follow. Human-reviewed, always.
          </p>
          <div className="mt-9">
            <a
              href="#/audience"
              className="bg-lamplight text-midnight rounded-xl px-6 py-3.5 text-sm font-semibold hover:bg-lamplight-dark transition-[background-color,transform] duration-150 active:scale-[0.97] inline-flex items-center gap-1.5"
            >
              Open the studio
              <Icon name="arrow_forward" />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-8 flex flex-col sm:flex-row gap-2 justify-between text-[11px] text-paper/40">
          <span>Pixar Ads Studio — an unofficial fan concept. Not affiliated with Pixar or Disney. All films are fictional.</span>
          <span>Built as an AI implementation showcase</span>
        </div>
      </section>
    </div>
  )
}
