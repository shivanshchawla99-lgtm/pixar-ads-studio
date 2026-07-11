import { useEffect, useState } from 'react'

export function Card({ children, className = '', style }) {
  return (
    <div className={`bg-panel rounded-2xl shadow-sm border border-paper/8 p-6 ${className}`} style={style}>
      {children}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-paper/70 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-xl border border-paper/15 bg-panel-2 text-paper px-3.5 py-2.5 text-sm placeholder:text-paper/35 focus:outline-none focus:ring-2 focus:ring-lamplight/50 focus:border-lamplight [color-scheme:dark]'

export function Button({ children, onClick, disabled, variant = 'primary', className = '' }) {
  const styles = {
    primary: 'bg-lamplight text-midnight hover:bg-lamplight-dark disabled:bg-paper/15 disabled:text-paper/40',
    soft: 'bg-panel-2 text-paper hover:bg-violet/30 border border-paper/12 disabled:opacity-50',
    ghost: 'bg-transparent text-lamplight hover:bg-lamplight/10 disabled:opacity-50',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-[transform,background-color,opacity] duration-150 [transition-timing-function:var(--ease-out-strong)] cursor-pointer active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Spinner({ label = 'Rolling film…' }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-paper/60">
      <span className="inline-block h-4 w-4 rounded-full border-2 border-lamplight border-t-transparent animate-spin [animation-duration:600ms]" />
      {label}
    </div>
  )
}

// Tag shown on results: "Live" (fresh API result) or "Cached" (golden fallback)
export function SourceBadge({ live }) {
  return live ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 text-teal text-xs font-semibold px-2.5 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Live
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-lamplight/15 text-lamplight text-xs font-semibold px-2.5 py-1">
      Cached example
    </span>
  )
}

// Rotating accent palette so cards get pops of colour beyond lamplight.
export const ACCENTS = [
  { border: 'border-t-lamplight', bg: 'bg-lamplight/12', text: 'text-lamplight' },
  { border: 'border-t-sky', bg: 'bg-sky/12', text: 'text-sky' },
  { border: 'border-t-teal', bg: 'bg-teal/12', text: 'text-teal' },
  { border: 'border-t-rose', bg: 'bg-rose/12', text: 'text-rose' },
  { border: 'border-t-violet', bg: 'bg-violet/15', text: 'text-violet' },
]

export function EngineBadge({ name, status }) {
  const cls =
    status === 'ready'
      ? 'bg-teal/15 text-teal'
      : status === 'key'
        ? 'bg-sky/15 text-sky'
        : 'bg-paper/8 text-paper/50'
  return <span className={`rounded-full text-xs font-semibold px-2.5 py-1 ${cls}`}>{name}</span>
}

export function ComingSoonNote({ children, icon = 'auto_awesome', hint }) {
  return (
    <div className="rounded-xl border border-paper/8 bg-panel px-4 py-3.5 flex items-center gap-3.5 group">
      <div className="h-10 w-10 shrink-0 rounded-full bg-violet/20 text-paper/70 flex items-center justify-center">
        <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm text-paper">{children}</div>
        <div className="text-xs text-paper/45">{hint || 'Coming soon'}</div>
      </div>
      <span className="material-symbols-outlined text-paper/25 ml-auto transition-transform group-hover:translate-x-0.5" style={{ fontSize: 20 }} aria-hidden>
        chevron_right
      </span>
    </div>
  )
}

// Tier label colour follows the verdict: gold only when it's earned.
const TIER_STYLES = {
  'Box Office Gold': 'bg-lamplight/15 text-lamplight',
  'Crowd Pleaser': 'bg-teal/15 text-teal',
  Matinee: 'bg-sky/15 text-sky',
  'Rough Cut': 'bg-ember/15 text-ember',
  'Straight to DVD': 'bg-rose/15 text-rose',
}

export function ScoreMeter({ overall, tiers }) {
  const tier = tiers.find((t) => overall >= t.min && overall <= t.max) || tiers[tiers.length - 1]
  return (
    <div className="flex items-center gap-4">
      <img src={tier.image} alt={`${tier.label} rating`} className="h-24 w-24 object-contain" />
      <div>
        <div className="text-4xl font-bold font-display text-paper tabular">{overall}<span className="text-lg font-semibold text-paper/40">/100</span></div>
        <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-sm font-semibold ${TIER_STYLES[tier.label] || 'bg-paper/8 text-paper/70'}`}>{tier.label}</span>
      </div>
    </div>
  )
}

// Quiet toast, bottom-right, auto-dismisses. Used for cached-fallback notices.
export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [message, onDone])
  if (!message) return null
  return (
    <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 rounded-xl bg-paper text-midnight text-sm px-4 py-3 shadow-lg toast-in">
      {message}
    </div>
  )
}

export function useToast() {
  const [msg, setMsg] = useState('')
  return { msg, show: setMsg, clear: () => setMsg('') }
}
