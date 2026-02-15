/**
 * PDF Upload & Parse Route
 * 
 * Handles PDF file uploads, parses them server-side, and returns
 * extracted text, metadata, and chunks. Optional — the client can
 * still parse client-side with pdfjs-dist as a fallback.
 * 
 * Limits: 50MB max file size.
 */
import { Router } from 'express'
import multer from 'multer'
import { readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const router = Router()

// ─── Multer Config ───────────────────────────────────────────────────
const upload = multer({
    dest: join(tmpdir(), 'ai-interview-uploads'),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 1,
    },
    fileFilter(_req, file, cb) {
        if (file.mimetype !== 'application/pdf') {
            cb(new Error('Only PDF files are allowed'))
            return
        }
        cb(null, true)
    },
})

// ─── PDF Parsing (server-side) ───────────────────────────────────────
async function parsePDF(buffer) {
    // Dynamic import for ESM compatibility
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise

    const pageTexts = []
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(' ')
        pageTexts.push(pageText)
    }

    const fullText = pageTexts.join('\n\n')

    // Metadata
    let info = {}
    try { info = await pdf.getMetadata() } catch { /* ignore */ }

    const metadata = {
        title: info?.info?.Title || 'Untitled',
        author: info?.info?.Author || 'Unknown',
        pageCount: pdf.numPages,
    }

    // Chunk the text (~8000 chars per chunk for LLM processing)
    const chunks = chunkContent(fullText, 8000)

    return { text: fullText, metadata, chunks }
}

function chunkContent(text, maxChars = 8000) {
    if (text.length <= maxChars) return [text]

    const chunks = []
    const paragraphs = text.split(/\n\s*\n/)
    let current = ''

    for (const para of paragraphs) {
        if (current.length + para.length + 2 > maxChars && current.length > 0) {
            chunks.push(current.trim())
            current = ''
        }
        current += para + '\n\n'
    }

    if (current.trim()) {
        chunks.push(current.trim())
    }

    return chunks.length > 0 ? chunks : [text.slice(0, maxChars)]
}

// ─── POST /api/upload-pdf ────────────────────────────────────────────
router.post('/upload-pdf', upload.single('pdf'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'BadRequest', message: 'No PDF file uploaded' })
    }

    const filePath = req.file.path

    try {
        const buffer = readFileSync(filePath)
        const result = await parsePDF(buffer)

        // Add file info to metadata
        result.metadata.fileName = req.file.originalname
        result.metadata.fileSize = req.file.size

        // Privacy: delete the uploaded file immediately after parsing
        try { unlinkSync(filePath) } catch { /* ignore */ }

        res.json(result)
    } catch (err) {
        // Clean up file on error
        try { unlinkSync(filePath) } catch { /* ignore */ }

        console.error('[Upload] PDF parse error:', err.message)
        next(new Error(`Failed to parse PDF: ${err.message}`))
    }
})

export default router
