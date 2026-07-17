import { useEffect, useState } from 'react'
import StoryGuard from './tools/StoryGuard.jsx'
import SparkEngine from './tools/SparkEngine.jsx'
import PosterStudio from './tools/PosterStudio.jsx'
import AudienceLab from './tools/AudienceLab.jsx'
import PersonaStudio from './tools/PersonaStudio.jsx'
import ScreeningRoom from './tools/ScreeningRoom.jsx'
import Home from './Home.jsx'

// Pipeline order: analyse → understand → ideate → produce → test → guard.
const TOOLS = [
  { path: '/audience', name: 'Audience Lab', icon: 'theater_comedy', dot: 'bg-sky', oneliner: 'Mine what audiences actually say into ad angles.', el: <AudienceLab /> },
  { path: '/personas', name: 'Persona Studio', icon: 'groups', dot: 'bg-violet', oneliner: 'Turn audience signals into living personas and targeting.', el: <PersonaStudio /> },
  { path: '/sparks', name: 'Spark Engine', icon: 'lightbulb', dot: 'bg-lamplight', oneliner: 'An always-on pipeline of story-first campaign ideas.', el: <SparkEngine /> },
  { path: '/poster', name: 'Poster Studio', icon: 'palette', dot: 'bg-ember', oneliner: 'On-brand posters and social creatives with the risky parts locked.', el: <PosterStudio />, fullBleed: true },
  { path: '/screening', name: 'Screening Room', icon: 'movie_filter', dot: 'bg-teal', oneliner: 'Four ad variants, scored head-to-head. Pick the winner.', el: <ScreeningRoom /> },
  { path: '/story-guard', name: 'Story Guard', icon: 'security', dot: 'bg-rose', oneliner: 'Every ad gets a screening before it ships.', el: <StoryGuard />, fullBleed: true },
]

function useHashRoute() {
  const get = () => window.location.hash.replace('#', '') || '/'
  const [route, setRoute] = useState(get)
  useEffect(() => {
    const onHash = () => setRoute(get())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

export default function App() {
  const route = useHashRoute()
  const tool = TOOLS.find((t) => t.path === route)

  if (!tool) return <Home />

  return (
    <div className="film-grain flex min-h-screen flex-col lg:flex-row bg-canvas">
      <aside className="shrink-0 bg-panel border-b lg:border-b-0 lg:border-r border-ink/8 flex flex-col lg:w-64">
        <div className="px-5 pt-5 pb-3 lg:px-6 lg:pt-7 lg:pb-6">
          <a href="#/" className="block">
            <div className="font-display font-bold text-2xl text-ink tracking-tight leading-none">
              Pixar <span className="text-joy-deep">Ads</span> Studio
            </div>
            <div className="text-[11px] text-ink/50 mt-1">Unofficial concept demo</div>
            <div className="mt-2 inline-block rounded-full bg-lamplight/15 px-2.5 py-0.5 text-[11px] font-semibold text-joy-deep">
              Story comes first
            </div>
            <div className="mt-3 hidden lg:flex gap-1.5">
              <span className="h-1.5 w-8 rounded-full bg-lamplight" />
              <span className="h-1.5 w-5 rounded-full bg-sky" />
              <span className="h-1.5 w-5 rounded-full bg-ember" />
              <span className="h-1.5 w-5 rounded-full bg-teal" />
              <span className="h-1.5 w-5 rounded-full bg-rose" />
            </div>
          </a>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0 lg:space-y-1 lg:gap-0">
          <a
            href="#/"
            className="relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 [transition-timing-function:var(--ease-out-strong)] active:scale-[0.98] text-ink/60 hover:text-joy-deep hover:bg-lamplight/5"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>home</span>
            Home
          </a>
          {TOOLS.map((t) => {
            const active = t.path === tool.path
            return (
              <a
                key={t.path}
                href={`#${t.path}`}
                className={`relative flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 [transition-timing-function:var(--ease-out-strong)] active:scale-[0.98] ${
                  active
                    ? 'text-joy-deep font-semibold bg-lamplight/10'
                    : 'text-ink/60 hover:text-joy-deep hover:bg-lamplight/5'
                }`}
              >
                {active && <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full ${t.dot}`} aria-hidden />}
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>{t.icon}</span>
                {t.name}
              </a>
            )
          })}
        </nav>
        <div className="hidden lg:block px-6 pb-5 text-[10px] leading-relaxed text-ink/35">
          Fan-made concept. Not affiliated with Pixar or Disney. All films fictional.
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur border-b border-ink/8 px-4 sm:px-8 py-4">
          <div className="flex items-center gap-2.5">
            <span className={`h-3 w-3 rounded-full ${tool.dot}`} aria-hidden />
            <h1 className="text-2xl font-semibold font-display text-ink">{tool.name}</h1>
          </div>
          <p className="text-sm text-ink/60 mt-1">{tool.oneliner}</p>
        </header>
        {/* All tools stay mounted so state survives tab switches; inactive ones are hidden. */}
        <main className="flex-1 min-w-0">
          {TOOLS.map((t) => (
            <div
              key={t.path}
              className={`${t.path === tool.path ? '' : 'hidden'} ${t.fullBleed ? '' : 'px-4 sm:px-8 pt-6 pb-4 max-w-6xl'}`}
            >
              {t.el}
            </div>
          ))}
        </main>
        <div className="px-4 sm:px-8 pb-8 max-w-6xl w-full flex justify-between text-[11px] text-ink/35">
          <span>One brand file under every tool. Human-reviewed, always.</span>
          <span>Unofficial fan concept. Films are fictional</span>
        </div>
      </div>
    </div>
  )
}
