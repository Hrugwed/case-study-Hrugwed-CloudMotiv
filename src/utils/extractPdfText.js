export const textContentToString = (items = []) =>
  items.map((item) => item?.str ?? '').join('')

const extractPdfText = async (pdfDoc) => {
  if (!pdfDoc) return []

  const pages = []

  for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
    const page = await pdfDoc.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const text = textContentToString(textContent.items)

    pages.push({
      pageNumber,
      text
    })
  }

  return pages
}

export default extractPdfText

