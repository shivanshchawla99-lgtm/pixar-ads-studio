import { useEffect, useRef, useState } from 'react'
import ideasData from '../data/golden/ideas.json'
import audienceData from '../data/golden/audience-lab.json'
import variantsData from '../data/golden/variants.json'
import creativeData from '../data/golden/creative.json'

function Icon({ name, size = 18 }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size }} aria-hidden>
      {name}
    </span>
  )
}

// The pipeline in narrative order. Each stage borrows one emotion colour.
// Honest copy only: every line is something the deployed tool actually does.
const STAGES = [
  {
    path: '/audience', name: 'Audience Lab', icon: 'theater_comedy', accent: 'text-sky', bg: 'bg-sky/12', ring: 'hover:border-sky/50',
    blurb: 'We read what audiences actually said and turn it into themes, verbatim quotes, and ready ad angles.',
  },
  {
    path: '/personas', name: 'Persona Studio', icon: 'groups', accent: 'text-violet', bg: 'bg-violet/15', ring: 'hover:border-violet/50',
    blurb: 'Those signals grow into living personas: wants, fears, media habits, the hooks that land. Every one cites its source.',
  },
  {
    path: '/sparks', name: 'Spark Engine', icon: 'lightbulb', accent: 'text-joy', bg: 'bg-joy/12', ring: 'hover:border-joy/50',
    blurb: 'An always-on reel of story-first campaign ideas, grounded in the brand file, one click from production.',
  },
  {
    path: '/poster', name: 'Poster Studio', icon: 'palette', accent: 'text-ember', bg: 'bg-ember/12', ring: 'hover:border-ember/50',
    blurb: 'Posters and social creatives with the risky parts locked: palette, type and wordmark fixed, characters never off-model.',
  },
  {
    path: '/screening', name: 'Screening Room', icon: 'movie_filter', accent: 'text-teal', bg: 'bg-teal/12', ring: 'hover:border-teal/50',
    blurb: 'Four ad variants for one brief, scored head to head against the brand rules. The winner earns the poster.',
  },
  {
    path: '/story-guard', name: 'Story Guard', icon: 'security', accent: 'text-red', bg: 'bg-red/12', ring: 'hover:border-red/50',
    blurb: 'Nothing ships without a screening. Any copy, checked for story, claims, voice and slop. Fixes and a rewrite included.',
  },
]

// Luxo-style desk lamp. Click it five times and the concept room opens.
function LampMark({ onWake }) {
  const taps = useRef(0)
  return (
    <button
      onClick={() => { taps.current += 1; if (taps.current >= 5) { taps.current = 0; onWake() } }}
      className="tactile group relative -ml-1 grid h-8 w-8 place-items-center rounded-full hover:bg-joy/10"
      title="Give it a tap"
      aria-label="Studio lamp"
    >
      <svg viewBox="0 0 40 40" className="h-6 w-6" aria-hidden>
        <ellipse cx="20" cy="36" rx="11" ry="2.4" fill="#F5F1E8" opacity="0.22" />
        <path d="M20 34 L20 24" stroke="#F5F1E8" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M20 24 L13 15" stroke="#F5F1E8" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M13 15 L21 9" stroke="#F5F1E8" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M12 12 q6 -8 13 -3 l-4 8 q-6 -4 -9 -5 z" fill="#F9D71C" className="transition-transform group-hover:-rotate-6 origin-bottom" />
        <circle cx="20.5" cy="11" r="1.6" fill="#121212" />
      </svg>
    </button>
  )
}

// Pizza Planet delivery truck, drifting across the far parallax layer.
// Its licence plate reads A113 for anyone who looks closely.
function PizzaTruck() {
  return (
    <div className="truck-drift absolute bottom-[14%] left-0 w-24 opacity-40 pointer-events-none hidden md:block" aria-hidden>
      <svg viewBox="0 0 120 70">
        <rect x="6" y="30" width="66" height="26" rx="3" fill="#E9E2CE" />
        <rect x="72" y="36" width="30" height="20" rx="3" fill="#D95D39" />
        <rect x="88" y="40" width="12" height="9" rx="1.5" fill="#5AC8FA" opacity="0.8" />
        <circle cx="26" cy="58" r="7" fill="#1A1A1D" stroke="#F5F1E8" strokeWidth="1.5" />
        <circle cx="86" cy="58" r="7" fill="#1A1A1D" stroke="#F5F1E8" strokeWidth="1.5" />
        <circle cx="34" cy="22" r="9" fill="#F9D71C" />
        <ellipse cx="34" cy="22" rx="13" ry="3.5" fill="#F9D71C" opacity="0.55" transform="rotate(-18 34 22)" />
        <rect x="40" y="47" width="16" height="7" rx="1" fill="#F5F1E8" />
        <text x="41.5" y="52.6" fontSize="5" fontFamily="monospace" fill="#1A1A1D">A113</text>
      </svg>
    </div>
  )
}

function ConceptRoom({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const art = creativeData.creatives.slice(0, 6)
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-midnight/85 backdrop-blur-sm p-4 fade-up" onClick={onClose}>
      <div
        className="toast-in relative w-full max-w-3xl rounded-3xl border border-joy/25 bg-panel p-6 sm:p-8 shadow-2xl"
        style={{ transformOrigin: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="tactile absolute top-4 right-4 grid h-8 w-8 place-items-center rounded-full text-paper/60 hover:bg-paper/10" aria-label="Close">
          <Icon name="close" size={18} />
        </button>
        <div className="text-xs font-bold uppercase tracking-widest text-joy">Room A113</div>
        <h3 className="font-display text-2xl text-paper mt-1">You found the concept room.</h3>
        <p className="text-sm text-paper/60 mt-1.5">Every studio has one. Here is a wall of the artwork the pipeline made earlier. Buckle up.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          {art.map((c) => (
            <div key={c.image} className="lift overflow-hidden rounded-xl border border-paper/8 bg-midnight">
              <img src={c.image} alt={c.headline} className="w-full aspect-square object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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
          <img src="/scores/gold.svg" alt="Gold star rating" className={`absolute inset-0 h-24 w-24 object-contain transition-[opacity,filter] duration-500 ${phase === 'good' ? 'opacity-100' : 'opacity-0 blur-sm'}`} />
        </div>
        <div>
          <div>
            <span ref={numRef} className="font-display font-black text-6xl tabular text-paper">8</span>
            <span className="text-paper/40 text-lg font-semibold">/100</span>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors inline-block mt-2 ${phase === 'good' ? 'bg-joy/15 text-joy' : 'bg-red/15 text-red'}`}>
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
      <p key={i} className="fade-up font-display font-bold text-xl md:text-2xl text-paper leading-snug mt-3 min-h-[6rem]">
        &ldquo;{ideas[i].hook}&rdquo;
      </p>
      <span className="rounded-full bg-joy/15 text-joy text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 inline-block mt-3">
        {ideas[i].channel}
      </span>
      <div className="flex gap-1 mt-5">
        {ideas.map((idea, n) => (
          <span key={idea.title} className={`h-1 rounded-full flex-1 transition-colors ${n === i ? 'bg-joy' : 'bg-paper/15'}`} />
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [introDone, setIntroDone] = useState(false)
  const [room, setRoom] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 1200)
    return () => clearTimeout(t)
  }, [])

  // Reveal-on-scroll. Content is never left hidden: a 1.5s safety net reveals
  // anything the observer has not already caught (or if IO is unsupported).
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target) }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    )
    els.forEach((e) => io.observe(e))
    const net = setTimeout(() => els.forEach((e) => e.classList.add('in')), 1500)
    return () => { io.disconnect(); clearTimeout(net) }
  }, [])

  const luma = audienceData.films['Luma']
  const love = luma.loves[0]
  const winner = variantsData.variants.find((v) => v.winner)

  const headline = 'Ads with the heart of a great film.'
  const words = headline.split(' ')

  return (
    <div className="film-grain bg-midnight min-h-screen text-paper">
      {/* Projector-beam intro: anticipation before the studio reveals */}
      {!introDone && (
        <div className="fixed inset-0 z-[80] pointer-events-none overflow-hidden bg-midnight iris-in" aria-hidden>
          <div className="beam absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-joy/25 to-transparent" />
        </div>
      )}

      {/* Nav */}
      <header className="absolute top-0 inset-x-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LampMark onWake={() => setRoom(true)} />
            <span className="font-display font-black text-xl text-paper">Pixar <span className="text-joy">Ads</span> Studio</span>
            <span className="text-[10px] text-paper/40 hidden sm:inline ml-1">unofficial concept</span>
          </div>
          <a
            href="#/audience"
            className="tactile bg-red text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-[0_8px_30px_-8px_rgba(227,24,55,0.6)] inline-flex items-center gap-1.5"
          >
            Open the studio
            <Icon name="arrow_forward" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden starfield keylight">
        <PizzaTruck />
        <span className="absolute top-[18%] right-[12%] text-joy twinkle pointer-events-none hidden md:block" aria-hidden><Icon name="star" size={22} /></span>
        <span className="absolute bottom-[24%] left-[9%] text-sky twinkle pointer-events-none hidden md:block" style={{ animationDelay: '1.2s' }} aria-hidden><Icon name="star" size={16} /></span>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center relative w-full pt-16">
          <div>
            <p className="fade-up text-joy text-sm font-bold tracking-wide uppercase" style={{ animationDelay: '250ms' }}>
              Analyse your audience. Build winning ads.
            </p>
            <h1 className="font-display font-black text-4xl md:text-5xl xl:text-6xl tracking-tight leading-[1.05] text-paper mt-4">
              {words.map((word, i) => {
                const glow = word === 'heart'
                return (
                  <span key={i}>
                    <span className={`word-up ${glow ? 'animate-joy' : ''}`} style={{ animationDelay: `${400 + i * 70}ms` }}>
                      {word}
                    </span>{' '}
                  </span>
                )
              })}
            </h1>
            <p className="fade-up text-paper/65 mt-5 max-w-[46ch] leading-relaxed" style={{ animationDelay: '1050ms' }}>
              We turn what your audience feels into ads worth the price of a ticket. Six tools, one story.
            </p>
            <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: '1250ms' }}>
              <a href="#/audience" className="tactile bg-red text-white rounded-xl px-5 py-3 text-sm font-semibold shadow-[0_8px_30px_-8px_rgba(227,24,55,0.6)] inline-flex items-center gap-1.5">
                Open the studio
                <Icon name="arrow_forward" />
              </a>
              <button
                type="button"
                onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
                className="tactile border border-paper/20 text-paper rounded-xl px-5 py-3 text-sm font-semibold hover:bg-panel inline-flex items-center gap-1.5"
              >
                See the pipeline
                <Icon name="arrow_downward" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="lift rounded-3xl bg-panel border border-paper/10 p-5 shadow-2xl shadow-black/50 rotate-1">
              <img src="/golden/luma-hero.svg" alt="Luma concept poster made in Poster Studio" className="w-full rounded-2xl" loading="eager" />
              <p className="text-joy/80 text-xs mt-4">Made in Poster Studio. Locked palette, locked type, lit by one warm light.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="relative border-t border-paper/8 bg-panel/40">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="font-display font-black text-3xl md:text-4xl text-paper text-center">From what audiences say to ads that win</h2>
          <p className="text-paper/60 text-center mt-3 max-w-2xl mx-auto">
            Every tool hands off to the next. Follow one thread down the rabbit hole: a screening note becomes a persona, a hook, a scored winner, a poster.
          </p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-12">
            {STAGES.map((s, i) => (
              <a
                key={s.path}
                href={`#${s.path}`}
                className={`reveal lift group rounded-2xl bg-panel border border-paper/8 p-6 ${s.ring}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`h-10 w-10 rounded-xl ${s.bg} ${s.accent} flex items-center justify-center`}>
                    <Icon name={s.icon} size={22} />
                  </span>
                  <span className="text-paper/25 font-display font-black text-sm">0{i + 1}</span>
                  <h3 className={`font-display font-bold text-lg text-paper transition-colors group-hover:${s.accent.replace('text-', 'text-')}`}>{s.name}</h3>
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
        <div className="reveal">
          <h2 className="font-display font-black text-3xl md:text-4xl text-paper">Audiences already wrote the ads</h2>
          <p className="text-paper/65 mt-4 max-w-[52ch] leading-relaxed">
            A parent said their daughter left the screening asking for a firefly nightlight.
            Audience Lab caught it, Persona Studio named her, Screening Room scored four ways to say it,
            and the winner became the poster.
          </p>
          <div className="mt-6 space-y-3">
            <div className="bg-panel rounded-2xl border border-paper/10 p-5">
              <span className="text-xs font-semibold text-sky">A real screening note (demo data)</span>
              <blockquote className="mt-2 italic text-paper/75 leading-relaxed text-sm">&ldquo;{love.quote}&rdquo;</blockquote>
            </div>
            <div className="text-center text-paper/40"><Icon name="south" size={24} /></div>
            <div className="bg-panel-2 rounded-2xl border border-joy/30 p-5">
              <span className="text-xs font-semibold text-joy">becomes the winning ad</span>
              <p className="font-display font-bold text-lg mt-2 text-paper">{winner.hook}</p>
              <p className="text-paper/75 text-sm mt-1.5">{winner.primary_text}</p>
              <span className="mt-3 inline-block rounded-full bg-joy/15 text-joy text-xs font-semibold px-3 py-1">Scored {winner.overall}/100 in Screening Room</span>
            </div>
          </div>
        </div>
        <div className="space-y-6 reveal">
          <HookTicker />
          <ScoreDemo />
        </div>
      </section>

      {/* Closing band */}
      <section className="relative bg-panel border-t border-paper/8 overflow-hidden">
        <div className="border-y border-paper/10 py-4 overflow-hidden whitespace-nowrap">
          <div className="marquee-track inline-flex gap-10 items-center will-change-transform">
            {[...Array(2)].flatMap((_, r) => [
              <span key={`a${r}`} className="font-display font-bold text-lg text-paper/70">Every ad should feel like the first ten minutes of a great film.</span>,
              <span key={`b${r}`} className="font-display font-bold text-lg text-joy">story first</span>,
              <span key={`c${r}`} className="font-display font-bold text-lg text-paper/70">One brand file under every tool.</span>,
              <span key={`d${r}`} className="font-display font-bold text-lg text-ember">no slop, ever</span>,
            ])}
          </div>
        </div>

        <div className="px-6 py-24 text-center max-w-3xl mx-auto">
          <h2 className="font-display font-black text-3xl md:text-5xl text-paper">One brand file under every tool.</h2>
          <p className="mt-5 text-paper/65 text-lg">
            Change the voice, a rule or a colour once and all six tools follow. Human-reviewed, always.
          </p>
          <div className="mt-9">
            <a href="#/audience" className="tactile bg-red text-white rounded-xl px-6 py-3.5 text-sm font-semibold shadow-[0_10px_40px_-10px_rgba(227,24,55,0.7)] inline-flex items-center gap-1.5">
              Open the studio
              <Icon name="arrow_forward" />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-8 flex flex-col sm:flex-row gap-2 justify-between text-[11px] text-paper/40">
          <span>Pixar Ads Studio, an unofficial fan concept. Not affiliated with Pixar or Disney. All films are fictional.</span>
          <span>Built as an AI implementation showcase</span>
        </div>
      </section>

      {room && <ConceptRoom onClose={() => setRoom(false)} />}
    </div>
  )
}
