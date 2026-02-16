---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: PDF Upload UI + Client-Side Parsing

## Objective
Build the drag-and-drop PDF upload experience on the Configure page and implement client-side text extraction using pdf.js — so students can upload their lecture materials and the system extracts raw text without any server dependency.

## Context
- .gsd/SPEC.md — PDF parsing via pdf.js (client-side), premium Linear UI
- src/pages/Configure.tsx — Current stub with upload placeholder
- src/lib/firebase.ts — Firebase already initialized
- src/index.css — Design tokens and theme

## Tasks

<task type="auto">
  <name>Install pdf.js and set up PDF parser utility</name>
  <files>
    - package.json (add pdfjs-dist dependency)
    - src/lib/pdf.ts (NEW — pdf parsing utility)
  </files>
  <action>
    1. Install `pdfjs-dist` package
    2. Create `src/lib/pdf.ts` with:
       - `parsePDF(file: File): Promise<{ text: string; pageCount: number; title: string }>` function
       - Use `pdfjs-dist` with `getDocument` to load a File as ArrayBuffer
       - Set the worker source to the CDN-hosted pdf.worker.min.mjs for the installed version
       - Iterate all pages with `page.getTextContent()`, join items into text
       - Extract title from first line of first page (trimmed) as a heuristic
       - Handle errors gracefully — return meaningful error messages
    3. Do NOT use any server-side parsing
    4. Do NOT use dynamic import() for the worker — use direct CDN string
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>pdfjs-dist installed, src/lib/pdf.ts exports parsePDF function, TypeScript compiles clean</done>
</task>

<task type="auto">
  <name>Build drag-and-drop upload UI on Configure page</name>
  <files>
    - src/pages/Configure.tsx (REWRITE — full upload UI)
    - src/components/FileDropzone.tsx (NEW — reusable dropzone component)
  </files>
  <action>
    1. Create `src/components/FileDropzone.tsx`:
       - Accept `onFileSelect(file: File)` prop
       - Drag-and-drop zone with dashed border, icon, and label
       - Also support click-to-browse with hidden file input (accept=".pdf")
       - Visual states: idle, drag-over (highlight border/bg), selected (show filename + size)
       - Use shadcn Card for container, Lucide icons (Upload, FileText, X)
       - Premium styling: subtle transitions, hover states
    2. Rewrite `src/pages/Configure.tsx`:
       - Import FileDropzone and parsePDF
       - State: file | null, parsing (boolean), parsedContent | null, error | null
       - On file select: set file, call parsePDF, show progress/loading state
       - After parsing: show extracted text preview (first 500 chars), page count, detected title
       - Show a "Continue" button (disabled until parsed) — does nothing yet (Phase 3 wires it)
       - Error state: show error card with retry option
       - Clean, generous spacing per design system
    3. Do NOT integrate Groq or Firestore yet — this plan is UI + parsing only
    4. Do NOT use any third-party upload libraries (react-dropzone etc.)
  </action>
  <verify>Open http://localhost:5173/configure, upload a PDF, verify text extraction displays</verify>
  <done>FileDropzone component works, Configure page shows parsed PDF content (text, pages, title), all TypeScript clean</done>
</task>

## Success Criteria
- [ ] `pdfjs-dist` installed and working client-side
- [ ] Drag-and-drop upload accepts PDF files
- [ ] PDF text is extracted and displayed on Configure page
- [ ] Loading/error states are handled gracefully
- [ ] TypeScript compiles with zero errors
