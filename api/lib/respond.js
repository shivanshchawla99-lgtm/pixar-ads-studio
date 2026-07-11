// Every function returns structured { ok, data, error } - the UI never sees a raw stack.
export function ok(res, data) {
  res.status(200).json({ ok: true, data, error: null })
}

export function fail(res, error, status = 200) {
  // 200 on purpose: the client treats ok:false as "fall back to cached", not an exception.
  res.status(status).json({ ok: false, data: null, error: String(error) })
}
