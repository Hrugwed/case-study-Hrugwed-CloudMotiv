import { useCallback, useState } from 'react'

const useGemini = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const requestGeminiMatch = useCallback(async ({ pageNumber, pageText, query }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pageNumber,
          pageText,
          query
        })
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Gemini request failed')
      }

      return payload.match?.trim() || ''
    } catch (err) {
      setError(err.message)
      return ''
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    requestGeminiMatch,
    loading,
    error
  }
}

export default useGemini

