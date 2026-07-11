// Cross-tool handoff: the pipeline glue that turns six tools into one studio.
// A tool writes a payload for a destination, navigates there via hash route;
// the destination consumes it exactly once when its route becomes active.
// Tools stay mounted across tab switches, so consumption is driven by
// hashchange, not component mount.

import { useEffect } from 'react'

const KEY = 'studio_handoff'

export function sendTo(path, payload) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ path, payload, ts: Date.now() }))
  } catch {
    /* quota or private mode: navigation still works, prefill is best-effort */
  }
  window.location.hash = path
}

// Returns the payload if one is addressed to `path`, and clears it (consume-once).
export function receiveFor(path) {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const { path: dest, payload } = JSON.parse(raw)
    if (dest !== path) return null
    sessionStorage.removeItem(KEY)
    return payload
  } catch {
    return null
  }
}

// Fires `onReceive(payload)` whenever a handoff addressed to `path` arrives,
// both on first load (deep link) and on every later navigation to the tool.
export function useHandoff(path, onReceive) {
  useEffect(() => {
    const check = () => {
      if (window.location.hash.replace('#', '') !== path) return
      const payload = receiveFor(path)
      if (payload) onReceive(payload)
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
