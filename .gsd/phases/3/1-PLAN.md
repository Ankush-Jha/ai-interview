---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: Interview Types + Groq Interview Engine

## Objective
Create the interview session data model and Groq-powered engine that generates Socratic questions from a StoredDocument and evaluates student answers. This is the backend logic—no UI changes.

## Context
- .gsd/SPEC.md
- src/types/document.ts (BloomLevel, Topic, DocumentAnalysis, StoredDocument)
- src/lib/groq.ts (existing Groq client pattern)

## Tasks

<task type="auto">
  <name>Interview session types</name>
  <files>src/types/interview.ts</files>
  <action>
    Create shared types for the interview engine:

    - `InterviewConfig` — persona ("socratic" | "friendly" | "challenging"), difficulty ("introductory" | "intermediate" | "advanced"), questionCount (5–20), questionTypes ("conceptual" | "applied" | "analytical")[]
    - `Question` — id, text, type, topic (Topic), bloomLevel, difficulty
    - `Answer` — questionId, text, timestamp
    - `Evaluation` — questionId, score (0–100), feedback, strengths[], gaps[], followUpQuestion?
    - `SessionState` — "configuring" | "in-progress" | "completed"
    - `InterviewSession` — id, documentId, userId, config, questions[], answers[], evaluations[], state, currentQuestionIndex, startedAt, completedAt?, overallScore?

    Keep types simple and serializable (no Date objects—use ISO strings for timestamps).
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>All interview types compile, exported, and importable</done>
</task>

<task type="auto">
  <name>Groq interview engine</name>
  <files>src/lib/interview-engine.ts</files>
  <action>
    Create the interview engine with two core functions:

    1. `generateQuestions(doc: StoredDocument, config: InterviewConfig): Promise<Question[]>`
       - System prompt: "You are a Socratic interviewer. Generate {n} questions..."
       - Include document summary + topics in context
       - Request JSON array response with question text, type, bloom level, topic name
       - Map config.difficulty to Bloom's target range (intro→remember/understand, intermediate→apply/analyze, advanced→evaluate/create)
       - Truncate rawText to first 4000 chars for context window

    2. `evaluateAnswer(question: Question, answer: string, documentContext: string): Promise<Evaluation>`
       - System prompt: "Evaluate this student answer using Socratic pedagogy..."
       - Return score (0–100), specific feedback, strengths, knowledge gaps
       - Optionally include a follow-up question for deeper probing
       - Truncate documentContext to 2000 chars

    Follow the same fetch + error handling pattern as existing groq.ts.
    Use response_format: { type: "json_object" } for both calls.
    Use temperature 0.7 for generation, 0.3 for evaluation.
  </action>
  <verify>npx tsc -b --noEmit</verify>
  <done>Both functions compile, handle errors, return typed results</done>
</task>

## Success Criteria
- [ ] `src/types/interview.ts` exports all session/question/evaluation types
- [ ] `src/lib/interview-engine.ts` exports `generateQuestions` and `evaluateAnswer`
- [ ] TypeScript compiles with zero errors
