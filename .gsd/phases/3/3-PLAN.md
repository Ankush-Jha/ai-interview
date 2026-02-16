---
phase: 3
plan: 3
wave: 2
---

# Plan 3.3: Session Persistence + Adaptive Difficulty + Dashboard Wiring

## Objective
Persist interview sessions to Firestore, implement adaptive difficulty (adjusts question difficulty based on running performance), and wire the Dashboard to show recent sessions alongside documents.

## Context
- .gsd/SPEC.md
- src/types/interview.ts (from Plan 3.1)
- src/hooks/useInterview.ts (from Plan 3.2)
- src/lib/documents.ts (pattern reference)
- src/pages/Dashboard.tsx

## Tasks

<task type="auto">
  <name>Session Firestore service + adaptive difficulty</name>
  <files>src/lib/sessions.ts, src/lib/interview-engine.ts</files>
  <action>
    **src/lib/sessions.ts** — Firestore CRUD for sessions:
    - `saveSession(userId, session)` → store under users/{userId}/sessions
    - `getUserSessions(userId)` → list all sessions, newest first
    - `getSession(userId, sessionId)` → single session
    - Follow same pattern as documents.ts (serverTimestamp, Timestamp conversion)

    **src/lib/interview-engine.ts** — Add adaptive difficulty:
    - New function: `adjustDifficulty(evaluations: Evaluation[], currentDifficulty: string): string`
    - Logic: if last 2 scores > 80 → bump up (introductory→intermediate→advanced)
    - If last 2 scores < 40 → bump down
    - Otherwise keep current
    - Update `useInterview` hook to call this before generating each question's difficulty context
    
    **src/hooks/useInterview.ts** — Wire persistence:
    - After session completes, auto-save to Firestore via saveSession
    - Pass adjusted difficulty into evaluateAnswer context
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>Sessions persist to Firestore, difficulty adapts based on performance</done>
</task>

<task type="auto">
  <name>Dashboard session display</name>
  <files>src/pages/Dashboard.tsx, src/hooks/useSessions.ts</files>
  <action>
    **src/hooks/useSessions.ts** — Mirror useDocuments pattern:
    - Fetch user sessions from Firestore
    - Return sessions, loading, error, refresh

    **src/pages/Dashboard.tsx** — Add "Recent Sessions" section below documents:
    - Show last 5 sessions as cards
    - Each card: document title, score, question count, date, state badge
    - Completed sessions: link to /results/:id
    - In-progress sessions: link to /session/:id (resume)
    - Empty state: "No interview sessions yet"
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>Dashboard shows recent sessions, sessions persist after completion</done>
</task>

## Success Criteria
- [ ] `src/lib/sessions.ts` CRUD for interview sessions
- [ ] Adaptive difficulty adjusts based on running score
- [ ] Completed sessions auto-save to Firestore
- [ ] Dashboard shows recent sessions alongside documents
- [ ] TypeScript compiles with zero errors
