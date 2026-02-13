import pdfParse from "pdf-parse";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PDFMetadata {
    title: string | null;
    author: string | null;
    pageCount: number;
    creationDate: string | null;
}

export interface ContentChunk {
    index: number;
    text: string;
    tokenEstimate: number;
}

export interface PDFContent {
    text: string;
    metadata: PDFMetadata;
    chunks: ContentChunk[];
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Extract raw text from a PDF buffer.
 */
export async function extractText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
}

/**
 * Extract metadata (title, author, page count, creation date) from a PDF buffer.
 */
export async function extractMetadata(buffer: Buffer): Promise<PDFMetadata> {
    const data = await pdfParse(buffer);
    return {
        title: data.info?.Title ?? null,
        author: data.info?.Author ?? null,
        pageCount: data.numpages,
        creationDate: data.info?.CreationDate ?? null,
    };
}

/**
 * Split text into chunks of approximately `maxTokens` tokens.
 * Uses a simple heuristic: 1 token ≈ 4 characters.
 * Splits on paragraph boundaries to keep context intact.
 */
export function chunkContent(
    text: string,
    maxTokens: number = 2000
): ContentChunk[] {
    const maxChars = maxTokens * 4;
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: ContentChunk[] = [];
    let currentChunk = "";
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const trimmed = paragraph.trim();
        if (!trimmed) continue;

        // If adding this paragraph would exceed the limit, flush the current chunk
        if (currentChunk.length + trimmed.length + 2 > maxChars && currentChunk.length > 0) {
            chunks.push({
                index: chunkIndex++,
                text: currentChunk.trim(),
                tokenEstimate: Math.ceil(currentChunk.trim().length / 4),
            });
            currentChunk = "";
        }

        currentChunk += trimmed + "\n\n";
    }

    // Push the last chunk
    if (currentChunk.trim().length > 0) {
        chunks.push({
            index: chunkIndex,
            text: currentChunk.trim(),
            tokenEstimate: Math.ceil(currentChunk.trim().length / 4),
        });
    }

    return chunks;
}

/**
 * Full extraction pipeline: text + metadata + chunked content.
 */
export async function parsePDF(buffer: Buffer): Promise<PDFContent> {
    const data = await pdfParse(buffer);

    const metadata: PDFMetadata = {
        title: data.info?.Title ?? null,
        author: data.info?.Author ?? null,
        pageCount: data.numpages,
        creationDate: data.info?.CreationDate ?? null,
    };

    const chunks = chunkContent(data.text);

    return {
        text: data.text,
        metadata,
        chunks,
    };
}
