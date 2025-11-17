const HIGHLIGHT_CLASS = 'highlight'

export const attachTextLayerMeta = (textLayer, textDivs, fullText) => {
  if (!textLayer) return

  const ranges = []
  let cursor = 0

  textDivs.forEach((div) => {
    const content = div.textContent ?? ''
    const start = cursor
    const end = start + content.length
    ranges.push({ div, start, end })
    cursor = end
  })

  textLayer.__pdfHighlightMeta = {
    fullText: fullText ?? '',
    ranges
  }
}

export const clearHighlights = (textLayer) => {
  if (!textLayer) return
  textLayer
    .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
    .forEach((node) => node.classList.remove(HIGHLIGHT_CLASS))
}

export const highlightExactText = (textLayer, exactText) => {
  if (!textLayer?.__pdfHighlightMeta || !exactText) return false

  const { fullText, ranges } = textLayer.__pdfHighlightMeta
  const trimmedTarget = exactText.trim()
  if (!trimmedTarget) return false

  const startIndex = fullText.indexOf(trimmedTarget)
  if (startIndex === -1) return false

  const endIndex = startIndex + trimmedTarget.length

  clearHighlights(textLayer)

  ranges.forEach(({ div, start, end }) => {
    if (end <= startIndex || start >= endIndex) {
      return
    }
    div.classList.add(HIGHLIGHT_CLASS)
  })

  const anchor = ranges.find(
    ({ start, end }) => start < endIndex && end > startIndex
  )

  anchor?.div?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })

  return true
}

