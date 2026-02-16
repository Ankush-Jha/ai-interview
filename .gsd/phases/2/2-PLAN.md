---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: Groq API Integration + Content Analysis

## Objective
Connect to the Groq API and analyze extracted PDF text — extracting topics, key concepts, and tagging content with Bloom's taxonomy levels. This structured analysis becomes the foundation for intelligent question generation in Phase 3.

## Context
- .gsd/SPEC.md — Groq API (free tier), content analysis
- src/lib/pdf.ts — parsePDF returns raw text
- .env.local — Needs VITE_GROQ_API_KEY added
- src/pages/Configure.tsx — Will display analysis results

## Pre-requisite
> User must add `VITE_GROQ_API_KEY=gsk_...` to `.env.local` before execution.

## Tasks

<task type="auto">
  <name>Create Groq API client and content analysis function</name>
  <files>
    - src/lib/groq.ts (NEW — Groq API client)
    - src/types/document.ts (NEW — shared types)
  </files>
  <action>
    1. Create `src/types/document.ts` with TypeScript types:
       - `Topic: { name: string; description: string; bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' }`
       - `DocumentAnalysis: { title: string; summary: string; topics: Topic[]; keyTerms: string[]; estimatedDifficulty: 'introductory' | 'intermediate' | 'advanced'; totalPages: number; rawText: string }`
       - `ParsedDocument: { file: File; text: string; pageCount: number; title: string }`
    2. Create `src/lib/groq.ts`:
       - Read API key from `import.meta.env.VITE_GROQ_API_KEY`
       - `analyzeContent(text: string, title: string): Promise<DocumentAnalysis>` function
       - Use `fetch()` to call `https://api.groq.com/openai/v1/chat/completions`
       - Model: `llama-3.3-70b-versatile` (Groq free tier)
       - System prompt: "You are an educational content analyzer. Given lecture material, extract: a summary (2-3 sentences), key topics with Bloom's taxonomy level, key terms, and overall difficulty. Return valid JSON."
       - Parse the JSON response, validate shape, return DocumentAnalysis
       - Handle API errors (rate limits, invalid key, network errors)
       - Truncate input text to ~6000 words to stay within context limits
    3. Do NOT install a Groq SDK — use raw fetch (fewer dependencies)
    4. Do NOT stream the response — simple request/response is fine
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>src/lib/groq.ts exports analyzeContent, src/types/document.ts exports all types, TypeScript compiles</done>
</task>

<task type="auto">
  <name>Wire analysis into Configure page with results display</name>
  <files>
    - src/pages/Configure.tsx (UPDATE — add analysis step)
  </files>
  <action>
    1. Update Configure page flow:
       a. Step 1: Upload PDF → parse text (existing)
       b. Step 2: Click "Analyze" → call analyzeContent → show results
    2. After analysis completes, display:
       - Document title and summary in a Card
       - Topics list with Bloom's level badges (use shadcn Badge with color-coded variants)
       - Key terms as small badges/chips
       - Estimated difficulty badge
       - "Start Interview" button (navigates to configure interview settings — Phase 3)
    3. Loading state: skeleton cards while analyzing ("Analyzing your material...")
    4. Error state: show error message with retry button
    5. Design: clean cards, generous spacing, subtle indigo accents for Bloom's badges
    6. Bloom's colors: remember=slate, understand=blue, apply=green, analyze=amber, evaluate=orange, create=violet
  </action>
  <verify>Open http://localhost:5173/configure, upload a PDF, verify Groq analysis displays topics and summary</verify>
  <done>Configure page shows full document analysis (summary, topics with Bloom's levels, key terms, difficulty) after PDF upload + analysis</done>
</task>

## Success Criteria
- [ ] Groq API client fetches and parses completions
- [ ] Content analysis returns topics, summary, key terms, difficulty
- [ ] Configure page shows analysis results with Bloom's taxonomy badges
- [ ] Error handling for missing API key, rate limits, network errors
- [ ] TypeScript compiles with zero errors
