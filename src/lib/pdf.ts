import * as pdfjsLib from 'pdfjs-dist'

// Set worker source to CDN for the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/build/pdf.worker.min.mjs'

export interface ParsedPDF {
    text: string
    pageCount: number
    title: string
}

/**
 * Parse a PDF file and extract its text content.
 * Runs entirely client-side using pdf.js.
 */
export async function parsePDF(file: File): Promise<ParsedPDF> {
    const arrayBuffer = await file.arrayBuffer()
    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

    const pages: string[] = []

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items
            .filter((item) => 'str' in item)
            .map((item) => (item as unknown as { str: string }).str)
            .join(' ')
        pages.push(pageText)
    }

    const fullText = pages.join('\n\n')

    // Heuristic: use first non-empty line as title, fallback to filename
    const firstLine = fullText.split('\n').find((l) => l.trim().length > 0)?.trim()
    const title = firstLine && firstLine.length < 200
        ? firstLine
        : file.name.replace(/\.pdf$/i, '')

    return {
        text: fullText,
        pageCount: doc.numPages,
        title,
    }
}
