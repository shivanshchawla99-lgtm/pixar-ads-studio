// Thin fetch wrapper for the Gemini API. Key comes ONLY from Vercel env vars.
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
export const TEXT_MODEL = 'gemini-2.5-flash'
export const IMAGE_MODEL = 'gemini-3.1-flash-image'

export function hasGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY)
}

async function call(model, body) {
  const res = await fetch(`${BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini ${model} returned ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// Returns parsed JSON when json=true, else plain text.
export async function geminiText(prompt, { temperature = 0.7, json = false, seed, topK, model } = {}) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: 'application/json' } : {}),
      ...(seed !== undefined ? { seed } : {}),
      ...(topK !== undefined ? { topK } : {}),
    },
  }
  const data = await call(model || TEXT_MODEL, body)
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
  if (!text) throw new Error('Gemini returned an empty response')
  return json ? JSON.parse(text) : text
}

// Returns { base64, mimeType } for the first image part.
// Optional { image: { mimeType, data } } prepends an inline photo part so
// Gemini can composite a real uploaded photo alongside the generated scene.
export async function geminiImage(prompt, { aspectRatio = '1:1', image = null } = {}) {
  const inputParts = image
    ? [{ inlineData: { mimeType: image.mimeType, data: image.data } }, { text: prompt }]
    : [{ text: prompt }]
  const body = {
    contents: [{ parts: inputParts }],
    generationConfig: { imageConfig: { aspectRatio } },
  }
  const data = await call(IMAGE_MODEL, body)
  const outParts = data?.candidates?.[0]?.content?.parts || []
  const img = outParts.find((p) => p.inlineData?.data)
  if (!img) throw new Error('Gemini returned no image (possible refusal)')
  return { base64: img.inlineData.data, mimeType: img.inlineData.mimeType || 'image/png' }
}
