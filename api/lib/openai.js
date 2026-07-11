// OpenAI image engine (optional). Accepts either env var name.
function key() {
  return process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY
}

export function hasOpenAIKey() {
  return Boolean(key())
}

const SIZES = {
  '1080x1080': '1024x1024',
  '1080x1920': '1024x1536',
  '1200x628': '1536x1024',
}

export async function openaiImage(prompt, format) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key()}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: SIZES[format] || '1024x1024',
      n: 1,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`OpenAI images returned ${res.status}: ${text.slice(0, 150)}`)
  }
  const data = await res.json()
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI returned no image')
  return { base64: b64, mimeType: 'image/png' }
}
