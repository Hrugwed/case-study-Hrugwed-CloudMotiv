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
        const message = payload?.error || 'Gemini request failed'
        setError(message)
        return { match: '', error: message }
      }

      const match = payload.match?.trim() || ''
      return { match, error: null }
    } catch (err) {
      setError(err.message)
      return { match: '', error: err.message }
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

