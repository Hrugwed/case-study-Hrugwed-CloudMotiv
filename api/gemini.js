export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable' })
    return
  }

  const payload =
    typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { pageText, query } = payload

  if (!pageText || !query) {
    res.status(400).json({ error: 'pageText and query are required' })
    return
  }

  const instruction = [
    'Return ONLY the exact substring found in pageText.',
    'Do NOT paraphrase.',
    'Do NOT summarize.',
    'Do NOT modify punctuation.',
    'Do NOT add markdown.',
    'Output must be copy-paste identical to the PDF text.'
  ].join(' ')

  const prompt = `${instruction}\n\npageText:\n"""${pageText}"""\n\nquery:\n"""${query}"""`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 256,
            candidateCount: 1
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Gemini API error')
    }

    const result = await response.json()
    const candidate =
      result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim() || ''

    if (!candidate) {
      throw new Error('Gemini returned an empty response')
    }

    res.status(200).json({ match: candidate })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message || 'Gemini request failed' })
  }
}

