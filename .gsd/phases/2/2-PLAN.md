# Plan 2.2: End-to-End Coding Flow Polish

## Objective
Ensure the coding interview flow works end-to-end: question renders → code editor appears → user writes code → tests run → AI evaluates → feedback appears. Fix any broken wiring.

## Context
@file src/pages/InterviewSession.jsx (lines 871-886: CodeEditor panel, line 445-450: handleCodeSubmit)
@file src/components/CodeEditor.jsx (Monaco + test runner UI)
@file src/lib/code-runner.js (JS Worker + Piston API execution)
@file server/routes/ai.js (lines 131-160: /api/evaluate-code)

## Why
REQ-12 is "Partial" — the infrastructure exists but the end-to-end flow hasn't been verified. Key concerns:
- Does `runTests` actually connect to Piston API?
- Does the test result display show pass/fail clearly?
- Does AI code review feedback integrate into the conversation?
- Is the split-pane layout responsive and usable?

## Tasks

### Task 1: Wire up and test code execution flow
1. Verify `runTests()` works for JavaScript (local Worker) — run a simple test
2. Verify Piston API connectivity for Python — handle failure gracefully
3. Ensure `handleCodeSubmit` → `doSubmit` → AI evaluation works end-to-end
4. Add fallback error messages if code execution fails

### Task 2: Code review feedback integration  
1. Ensure AI code review shows in chat (via `evaluateCode` in gemini.js)
2. Add code-specific feedback: complexity analysis, edge case suggestions
3. Show test results summary in the chat thread (not just in the editor panel)

### Verification
- [ ] JavaScript code runs in CodeEditor and shows pass/fail
- [ ] Code submission triggers AI feedback in chat
- [ ] Test results summary appears in conversation
- [ ] Build passes: `npx vite build`
