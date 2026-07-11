// Cache-first API helper. Every call returns { ok, data, error } and never throws.
// Callers keep their golden result on any failure - no error screens, ever.

export async function runLive(path, body, { timeoutMs = 55000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
      signal: controller.signal,
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json || json.ok === false) {
      return { ok: false, data: null, error: (json && json.error) || `Request failed (${res.status})` }
    }
    return { ok: true, data: json.data, error: null }
  } catch (err) {
    const msg = err.name === 'AbortError' ? 'Timed out' : 'Network error'
    return { ok: false, data: null, error: msg }
  } finally {
    clearTimeout(timer)
  }
}
