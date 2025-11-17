import { useEffect, useRef } from 'react'
import { EventBus, PDFPageView } from 'pdfjs-dist/legacy/web/pdf_viewer'
import 'pdfjs-dist/web/pdf_viewer.css'
import { textContentToString } from '../utils/extractPdfText'
import { attachTextLayerMeta } from '../utils/highlight'

const PdfViewer = ({ pdfDoc, onTextLayerReady }) => {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!pdfDoc || !container) {
      return
    }

    let cancelled = false
    const eventBus = new EventBus()
    container.innerHTML = ''

    const renderDocument = async () => {
      for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
        if (cancelled) break

        const page = await pdfDoc.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1 })

        const pageWrapper = document.createElement('div')
        pageWrapper.className =
          'pdf-page-wrapper relative mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm'
        container.appendChild(pageWrapper)

        const pageView = new PDFPageView({
          container: pageWrapper,
          id: pageNumber,
          scale: 1,
          defaultViewport: viewport,
          eventBus,
          textLayerMode: 2,
          annotationMode: 2
        })

        pageView.setPdfPage(page)
        await pageView.draw()

        const textLayerDiv = pageView.textLayer?.textLayerDiv
        const textContent = await page.getTextContent()
        const pageText = textContentToString(textContent.items)
        const textSpans = textLayerDiv
          ? Array.from(textLayerDiv.querySelectorAll('span'))
          : []

        attachTextLayerMeta(textLayerDiv, textSpans, pageText)
        onTextLayerReady?.(pageNumber, textLayerDiv, pageText)
      }
    }

    renderDocument()

    return () => {
      cancelled = true
      container.innerHTML = ''
    }
  }, [pdfDoc, onTextLayerReady])

  return (
    <section
      ref={containerRef}
      className="space-y-8"
      aria-label="Maersk PDF viewer"
    />
  )
}

export default PdfViewer

