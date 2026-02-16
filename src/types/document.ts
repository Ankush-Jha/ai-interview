// ── Bloom's Taxonomy Levels ────────────────────────────────────────
export type BloomLevel =
    | 'remember'
    | 'understand'
    | 'apply'
    | 'analyze'
    | 'evaluate'
    | 'create'

// ── Content Analysis Types ─────────────────────────────────────────
export interface Topic {
    name: string
    description: string
    bloomLevel: BloomLevel
}

export interface DocumentAnalysis {
    title: string
    summary: string
    topics: Topic[]
    keyTerms: string[]
    estimatedDifficulty: 'introductory' | 'intermediate' | 'advanced'
    totalPages: number
    rawText: string
}

// ── Parsed PDF (from pdf.ts) ───────────────────────────────────────
export interface ParsedDocument {
    file: File
    text: string
    pageCount: number
    title: string
}

// ── Firestore Document (Plan 2.3) ──────────────────────────────────
export interface StoredDocument {
    id: string
    userId: string
    title: string
    summary: string
    topics: Topic[]
    keyTerms: string[]
    estimatedDifficulty: string
    totalPages: number
    rawText: string
    fileName: string
    fileSize: number
    createdAt: Date
    updatedAt: Date
}
