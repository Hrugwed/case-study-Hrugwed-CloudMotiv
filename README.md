# Maersk EBITDA Evidence Viewer

A production-ready React + Vite + Tailwind application that renders the Maersk Q2 2025 interim report PDF on the left and a structured analysis panel on the right. Each insight references a specific PDF page; clicking the reference runs a hybrid matcher (fuzzy algorithm + Gemini fallback) to highlight the exact passage within the PDF text layer.

## Project Structure

```
src/
  components/
    AnalysisPanel.jsx
    PdfViewer.jsx
  data/analysis.json
  hooks/useGemini.js
  utils/
    extractPdfText.js
    fuzzyMatch.js
    highlight.js
  App.jsx
  main.jsx
api/gemini.js      # Vercel serverless function
public/Maersk.pdf  # Source PDF (add your copy)
```

## Prerequisites

- Node.js 18+
- npm 10+
- Gemini API key (free tier works) stored as `GEMINI_API_KEY`
- `public/Maersk.pdf` (place the Maersk report here; not bundled in repo)

## Local Development

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the Maersk PDF into `public/Maersk.pdf`
3. Create an `.env.local` (used by Vercel + local dev serverless functions)
   ```
   GEMINI_API_KEY=your-key-here
   ```
4. Start the app
   ```bash
   npm run dev
   ```
5. For a production-like run (Vercel serverless, env vars, etc.)
   ```bash
   vercel dev
   ```

## Deployment (Vercel)

1. `vercel login`
2. `vercel link`
3. Set env var in Vercel dashboard or CLI:
   ```bash
   vercel env add GEMINI_API_KEY production
   vercel env add GEMINI_API_KEY preview
   ```
4. `vercel --prod`

The `/api/gemini` serverless function proxies Gemini requests so the client never exposes the API key.

## How Matching Works

1. **Page-aware filtering** – each reference stores its page number; only that page’s text is scanned.
2. **Fuzzy pass** – normalized sliding window scoring (Levenshtein similarity via `string-similarity`). If the score ≥ 0.75, the exact substring is highlighted immediately.
3. **Gemini fallback** – only invoked when fuzzy score is weak. The function sends *only* that page’s text plus the reference query with strict instructions to return the untouched PDF substring.
4. **Highlight engine** – pdf.js renders both canvas and textLayer spans; when a substring is located, the corresponding spans receive a yellow highlight and scroll into view smoothly.

## Testing Checklist

- `npm run dev` – ensure PDF loads and references highlight text
- `npm run build && npm run preview` – verify production bundle
- `vercel dev` – confirm serverless Gemini proxy works locally

## Notes

- The repository ships without the Maersk PDF. Supply `public/Maersk.pdf` manually.
- Gemini requests are minimized by slicing each page to 6,000 chars max and only calling the API when the fuzzy score is below threshold.
