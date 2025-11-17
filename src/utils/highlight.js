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

const applyInlineHighlight = (div) => {
  if (!div) return
  if (!div.dataset.prevBackground) {
    div.dataset.prevBackground = div.style.backgroundColor || ''
  }
  if (!div.dataset.prevColor) {
    div.dataset.prevColor = div.style.color || ''
  }
  div.style.backgroundColor = '#fde68a'
  div.style.color = '#111827'
}

const resetInlineHighlight = (div) => {
  if (!div) return
  if (div.dataset.prevBackground !== undefined) {
    div.style.backgroundColor = div.dataset.prevBackground
    delete div.dataset.prevBackground
  }
  if (div.dataset.prevColor !== undefined) {
    div.style.color = div.dataset.prevColor
    delete div.dataset.prevColor
  }
}

export const clearHighlights = (textLayer) => {
  if (!textLayer) return
  textLayer
    .querySelectorAll(`.${HIGHLIGHT_CLASS}`)
    .forEach((node) => {
      node.classList.remove(HIGHLIGHT_CLASS)
      resetInlineHighlight(node)
    })
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
    applyInlineHighlight(div)
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

