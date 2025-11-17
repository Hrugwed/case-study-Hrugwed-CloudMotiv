const HIGHLIGHT_CLASS = 'highlight-span'
const escapeRegex = (value = '') =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normalizeMatchedText = (text = '') =>
  text.replace(/\s+/g, ' ').trim()

const findMatchBounds = (fullText, matchedText) => {
  const sanitizedTarget = normalizeMatchedText(matchedText)
  if (!sanitizedTarget) {
    return { start: -1, end: -1 }
  }

  const pattern = escapeRegex(sanitizedTarget).replace(/\\\s\+/g, '\\s+')
  const regex = new RegExp(pattern, 'i')
  const match = fullText.match(regex)

  if (!match || typeof match.index !== 'number') {
    return { start: -1, end: -1 }
  }

  const start = match.index
  const end = start + match[0].length
  return { start, end }
}

export const highlightSubstring = (matchedText, pageContainer) => {
  if (!matchedText || !pageContainer) return false

  const textLayer = pageContainer.querySelector('.textLayer')
  if (!textLayer) return false

  const spans = textLayer.querySelectorAll('span')
  if (!spans.length) return false

  const fullTextParts = []
  const mapping = []
  let cursor = 0

  spans.forEach((span) => {
    const content = span.textContent ?? ''
    const start = cursor
    const end = start + content.length

    mapping.push({ start, end, span })
    fullTextParts.push(content)
    cursor = end
  })

  const fullText = fullTextParts.join('')
  const { start, end } = findMatchBounds(fullText, matchedText)

  if (start === -1 || end === -1) {
    return false
  }

  document
    .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
    .forEach((node) => node.classList.remove(HIGHLIGHT_CLASS))

  const highlightedSpans = []

  mapping.forEach(({ span, start: spanStart, end: spanEnd }) => {
    const overlaps = spanEnd > start && spanStart < end
    if (overlaps) {
      span.classList.add(HIGHLIGHT_CLASS)
      highlightedSpans.push(span)
    }
  })

  highlightedSpans[0]?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })

  return highlightedSpans.length > 0
}

