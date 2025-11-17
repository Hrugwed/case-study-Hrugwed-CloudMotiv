import stringSimilarity from 'string-similarity'

const sanitize = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const tokenize = (text = '') => {
  const tokens = []
  const regex = /\S+/g
  let match

  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      original: text.slice(match.index, match.index + match[0].length),
      start: match.index,
      end: match.index + match[0].length,
      normalized: sanitize(match[0])
    })
  }

  if (!tokens.length && text) {
    tokens.push({
      original: text,
      start: 0,
      end: text.length,
      normalized: sanitize(text)
    })
  }

  return tokens
}

export const MATCH_THRESHOLD = 0.75

export const findBestFuzzyMatch = (query = '', pageText = '') => {
  const normalizedQuery = sanitize(query)
  if (!normalizedQuery || !pageText) {
    return null
  }

  const tokens = tokenize(pageText)
  if (!tokens.length) return null

  const queryWords = normalizedQuery.split(' ').length || 1
  const minWindow = Math.max(3, Math.min(queryWords, tokens.length))
  const maxWindow = Math.min(tokens.length, queryWords + 8)

  let bestMatch = { score: 0, substring: '', start: 0, end: 0 }

  for (let windowSize = minWindow; windowSize <= maxWindow; windowSize += 1) {
    for (let i = 0; i <= tokens.length - windowSize; i += 1) {
      const slice = tokens.slice(i, i + windowSize)
      const normalizedSlice = slice.map((token) => token.normalized).join(' ')
      const score = stringSimilarity.compareTwoStrings(
        normalizedQuery,
        normalizedSlice
      )

      if (score > bestMatch.score) {
        const start = slice[0].start
        const end = slice[slice.length - 1].end
        const substring = pageText.slice(start, end)

        bestMatch = { score, substring, start, end }
      }
    }
  }

  return bestMatch
}

