import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  GlobalWorkerOptions,
  getDocument
} from 'pdfjs-dist/legacy/build/pdf'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker?url'
import PdfViewer from './components/PdfViewer'
import AnalysisPanel from './components/AnalysisPanel'
import analysisData from './data/analysis.json'
import extractPdfText from './utils/extractPdfText'
import { findBestFuzzyMatch, MATCH_THRESHOLD } from './utils/fuzzyMatch'
import { highlightSubstring } from './utils/highlight'
import useGemini from './hooks/useGemini'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function App() {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pdfPages, setPdfPages] = useState([])
  const [status, setStatus] = useState('Loading Maersk.pdf …')
  const [activeReferenceId, setActiveReferenceId] = useState(null)
  const [pendingHighlight, setPendingHighlight] = useState(null)
  const [pageLayerVersion, setPageLayerVersion] = useState(0)
  const pageContainersRef = useRef(new Map())
  const matchRequestRef = useRef(0)

  const { requestGeminiMatch, loading: geminiLoading, error: geminiError } =
    useGemini()

  const analysis = useMemo(() => analysisData, [])

  useEffect(() => {
    let mounted = true

    const loadPdf = async () => {
      try {
        const loadingTask = getDocument('/Maersk.pdf')
        const doc = await loadingTask.promise
        if (!mounted) return
        setPdfDoc(doc)

        const pages = await extractPdfText(doc)
        if (!mounted) return
        setPdfPages(pages)
        setStatus('Select any reference to highlight it inside the PDF.')
      } catch (err) {
        console.error(err)
        if (!mounted) return
        setStatus(
          'Unable to load Maersk.pdf. Confirm the file exists in /public/Maersk.pdf.'
        )
      }
    }

    loadPdf()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!pendingHighlight) return
    const { pageNumber, text, fallbackText, referenceLabel } = pendingHighlight
    const pageContainer = pageContainersRef.current.get(pageNumber)
    if (!pageContainer) return

    let success = highlightSubstring(text, pageContainer)

    if (!success && fallbackText && fallbackText !== text) {
      success = highlightSubstring(fallbackText, pageContainer)
    }

    if (success) {
      setStatus(`Highlighted ${referenceLabel} on page ${pageNumber}.`)
    } else {
      setStatus(
        `Match located for ${referenceLabel}, but highlighting failed. Try zooming or clicking again.`
      )
    }
  }, [pendingHighlight, pageLayerVersion])

  useEffect(() => {
    if (geminiError) {
      setStatus(`Gemini error: ${geminiError}`)
    }
  }, [geminiError])

  const handleTextLayerReady = useCallback((pageNumber, pageContainer) => {
    if (!pageContainer) return
    pageContainersRef.current.set(pageNumber, pageContainer)
    setPageLayerVersion((version) => version + 1)
  }, [])

  const runHybridMatch = useCallback(
    async (reference, requestId) => {
      const pageData = pdfPages.find(
        (page) => page.pageNumber === reference.page
      )

      if (!pageData || matchRequestRef.current !== requestId) {
        setStatus('Page text not ready yet—please wait a moment.')
        return
      }

      const fuzzyResult = findBestFuzzyMatch(reference.query, pageData.text)
      if (
        matchRequestRef.current === requestId &&
        fuzzyResult?.score >= MATCH_THRESHOLD &&
        fuzzyResult.substring
      ) {
        setPendingHighlight({
          pageNumber: reference.page,
          text: fuzzyResult.substring,
          referenceLabel: reference.referenceId
        })
        setStatus(
          `Fuzzy match succeeded (score ${fuzzyResult.score.toFixed(
            2
          )}). Highlighting ${reference.referenceId}.`
        )
        return
      }

      if (matchRequestRef.current === requestId) {
        setStatus(
          `Fuzzy match was inconclusive for ${reference.referenceId}. Contacting Gemini …`
        )
      }

      const sanitizedPageText = pageData.text.slice(0, 6000)
      const { match: geminiMatch, error: geminiMessage } = await requestGeminiMatch({
        pageNumber: reference.page,
        pageText: sanitizedPageText,
        query: reference.query
      })

      if (matchRequestRef.current !== requestId) return

      if (!geminiMatch) {
        if (fuzzyResult?.substring) {
        setPendingHighlight({
          pageNumber: reference.page,
          text: fuzzyResult.substring,
          referenceLabel: reference.referenceId
        })
          const reason = geminiMessage
            ? geminiMessage.charAt(0).toUpperCase() + geminiMessage.slice(1)
            : 'Gemini unavailable'
          setStatus(
            `${reason}; using algorithmic match (score ${(
              fuzzyResult.score ?? 0
            ).toFixed(2)}).`
          )
          return
        }

        setStatus(
          `Gemini could not locate ${reference.referenceId}. Please verify the PDF content.`
        )
        return
      }

      setPendingHighlight({
        pageNumber: reference.page,
        text: geminiMatch,
        fallbackText: fuzzyResult?.substring,
        referenceLabel: reference.referenceId
      })
      setStatus(`Gemini located the passage for ${reference.referenceId}.`)
    },
    [pdfPages, requestGeminiMatch]
  )

  const handleReferenceSelect = useCallback(
    (reference) => {
      if (!reference) return
      setActiveReferenceId(reference.id)
      matchRequestRef.current += 1
      const requestId = matchRequestRef.current
      setStatus(
        `Matching ${reference.referenceId} on page ${reference.page} …`
      )

      runHybridMatch(reference, requestId)
    },
    [runHybridMatch]
  )

  return (
    <main className="min-h-screen w-full bg-white text-ink">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-8 py-4 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
          Maersk EBITDA Analysis — Q2 2025
        </p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">PDF Evidence Explorer</h1>
          <div className="text-xs text-slate-500">
            {geminiLoading ? 'Gemini fallback running …' : status}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-6 py-6 lg:flex-row">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:w-[58%] overflow-hidden">
          <PdfViewer
            pdfDoc={pdfDoc}
            onTextLayerReady={handleTextLayerReady}
          />
        </div>
        <AnalysisPanel
          data={analysis}
          onReferenceSelect={handleReferenceSelect}
          activeReferenceId={activeReferenceId}
          matchStatus={status}
        />
      </div>
    </main>
  )
}

export default App
