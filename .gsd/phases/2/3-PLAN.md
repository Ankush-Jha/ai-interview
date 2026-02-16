---
phase: 2
plan: 3
wave: 2
---

# Plan 2.3: Firestore Storage + Dashboard Documents

## Objective
Persist uploaded documents and their analysis results to Firestore, and update the Dashboard to show the user's document library — so students can see their uploaded materials and start new interviews from past uploads.

## Context
- .gsd/SPEC.md — Firestore storage, per-user data
- src/lib/firebase.ts — Firebase initialized (auth + app)
- src/types/document.ts — DocumentAnalysis, ParsedDocument types
- src/pages/Dashboard.tsx — Currently shows action cards
- src/pages/Configure.tsx — Upload + analysis flow

## Tasks

<task type="auto">
  <name>Create Firestore document service</name>
  <files>
    - src/lib/firebase.ts (UPDATE — export Firestore db)
    - src/lib/documents.ts (NEW — Firestore CRUD for documents)
    - src/types/document.ts (UPDATE — add StoredDocument type)
  </files>
  <action>
    1. Update `src/lib/firebase.ts`:
       - Import and initialize `getFirestore`
       - Export `db` (Firestore instance)
    2. Update `src/types/document.ts`:
       - Add `StoredDocument: { id: string; userId: string; title: string; summary: string; topics: Topic[]; keyTerms: string[]; estimatedDifficulty: string; totalPages: number; rawText: string; fileName: string; fileSize: number; createdAt: Timestamp; updatedAt: Timestamp }`
    3. Create `src/lib/documents.ts`:
       - `saveDocument(userId: string, analysis: DocumentAnalysis, file: File): Promise<string>` — saves to `users/{userId}/documents/{docId}`, returns docId
       - `getUserDocuments(userId: string): Promise<StoredDocument[]>` — fetches all docs, sorted by createdAt desc
       - `getDocument(userId: string, docId: string): Promise<StoredDocument | null>` — fetches single doc
       - `deleteDocument(userId: string, docId: string): Promise<void>` — deletes a doc
       - Use collection path `users/{userId}/documents` for per-user isolation
       - Use `serverTimestamp()` for createdAt/updatedAt
    4. Do NOT store the raw PDF file in Firestore — only store extracted text and metadata
    5. Do NOT use Firebase Storage — keep it Spark-plan friendly
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>Firestore service exports CRUD functions, StoredDocument type defined, TypeScript compiles</done>
</task>

<task type="auto">
  <name>Wire Firestore into Configure page and update Dashboard</name>
  <files>
    - src/pages/Configure.tsx (UPDATE — save to Firestore after analysis)
    - src/pages/Dashboard.tsx (UPDATE — show user's documents)
    - src/hooks/useDocuments.ts (NEW — hook for fetching user docs)
  </files>
  <action>
    1. Create `src/hooks/useDocuments.ts`:
       - `useDocuments()` hook that uses useAuth for userId
       - Fetches user documents on mount via getUserDocuments
       - Returns `{ documents, loading, error, refresh }` 
       - Use useEffect + useState (no real-time listener needed for v1)
    2. Update `src/pages/Configure.tsx`:
       - After successful analysis, call `saveDocument(userId, analysis, file)`
       - Show toast success ("Document saved") via Sonner
       - Add a "Start Interview" button that navigates to `/configure/${docId}/interview-setup` (Phase 3 route — just navigate, page doesn't exist yet)
    3. Update `src/pages/Dashboard.tsx`:
       - Import useDocuments hook
       - Replace "Recent Sessions" card with a document list
       - If documents exist: show cards with title, summary snippet, topic count, page count, date
       - Each card links to `/configure/${docId}/interview-setup` (future Phase 3 route)
       - If no documents: keep the current empty state message
       - Add a delete button (subtle, icon-only) on each card with confirmation
       - Loading state: skeleton cards
    4. Design: document cards should be clean, compact, with subtle hover states
  </action>
  <verify>Open dashboard, verify saved documents appear. Upload new PDF, verify it appears in dashboard list</verify>
  <done>Documents persist to Firestore, Dashboard shows user's documents with metadata, delete works</done>
</task>

## Success Criteria
- [ ] Documents saved to Firestore under users/{userId}/documents
- [ ] Dashboard fetches and displays user's uploaded documents
- [ ] Document cards show title, summary, topic count, date
- [ ] Delete document works with confirmation
- [ ] TypeScript compiles with zero errors
