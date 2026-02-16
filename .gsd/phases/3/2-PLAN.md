---
phase: 3
plan: 2
wave: 2
---

# Plan 3.2: Interview Session UI

## Objective
Build the conversational interview page — one question at a time, text answer input, real-time feedback display, and session progress. Wire Configure → Session navigation.

## Context
- .gsd/SPEC.md
- src/types/interview.ts (from Plan 3.1)
- src/lib/interview-engine.ts (from Plan 3.1)
- src/lib/documents.ts (getDocument)
- src/pages/Session.tsx (placeholder to replace)
- src/pages/Configure.tsx (needs "Save & Start Interview" wiring)

## Tasks

<task type="auto">
  <name>useInterview hook + session state management</name>
  <files>src/hooks/useInterview.ts</files>
  <action>
    Create a React hook that orchestrates the full interview lifecycle:

    1. `useInterview(documentId: string, config: InterviewConfig)`
    2. Internal state: session (InterviewSession), loading, error
    3. On mount: load document from Firestore, call generateQuestions, set state to "in-progress"
    4. `submitAnswer(text: string)` — saves answer, calls evaluateAnswer, advances currentQuestionIndex
    5. `currentQuestion` — computed from session.questions[currentQuestionIndex]
    6. `latestEvaluation` — the evaluation for the most recently answered question
    7. `progress` — { current: number, total: number, score: number }
    8. When all questions answered → set state to "completed", compute overallScore

    Do NOT persist to Firestore yet (Plan 3.3 handles that).
    Store session in React state only.
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>Hook compiles, manages full interview lifecycle in memory</done>
</task>

<task type="auto">
  <name>Session page + Configure wiring</name>
  <files>src/pages/Session.tsx, src/pages/Configure.tsx</files>
  <action>
    **Session.tsx** — Replace placeholder with full interview UI:

    1. Read `documentId` and `config` from URL params / location state
    2. Use `useInterview(documentId, config)` hook
    3. Three main views based on session state:

    **Loading state:** Skeleton + "Generating questions…"

    **In-progress:** 
    - Progress bar (question N of M)
    - Current question card with topic badge + Bloom's level
    - Textarea for answer (min 2 lines)
    - "Submit Answer" button (disabled while evaluating)
    - After submission: evaluation card with score ring, feedback, strengths (green), gaps (amber)
    - "Next Question" button to advance
    - If follow-up exists, show as a hint/probe below feedback

    **Completed:**
    - Overall score display (large number)
    - Summary: questions answered, average score, time taken
    - "View Results" button → links to /results/:id (stub for now)
    - "Back to Dashboard" button

    **Configure.tsx** — Update the "Save & Continue" flow:
    - After saving document to Firestore, navigate to `/session/{docId}` with config in location state
    - Pass default config: { persona: "socratic", difficulty: doc.estimatedDifficulty, questionCount: 5, questionTypes: ["conceptual", "applied"] }
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>Session page renders interview flow, Configure navigates to session after save</done>
</task>

## Success Criteria
- [ ] `useInterview` hook manages question → answer → evaluate → next lifecycle
- [ ] Session page shows loading → question → evaluation → completed states
- [ ] Configure page navigates to `/session/:id` after document save
- [ ] TypeScript compiles with zero errors
