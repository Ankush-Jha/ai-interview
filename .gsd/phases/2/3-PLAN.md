# Plan 2.3: Coding UX — Timer, Hints, and Results Display

## Objective
Add polished UX features specific to coding questions: per-question timer with urgency states, progressive hint system, and a rich test results panel.

## Context
@file src/components/CodeEditor.jsx (already accepts `hints`, `difficulty`, `points` props)
@file src/pages/InterviewSession.jsx (has global timer — need per-coding-question timer)
@file src/index.css (animation utilities)

## Why
Coding interviews need time pressure and progressive hints to simulate real interview conditions. The CodeEditor already accepts hints but the display quality and timer integration need polish.

## Tasks

### Task 1: Per-question coding timer
1. Add a countdown timer in the CodeEditor header (not the global session timer)
2. Timer based on difficulty: easy=10min, medium=20min, hard=30min
3. Visual urgency: green → amber (50%) → red (25%) → flashing (10%)
4. When timer expires, auto-submit current code with a "Time's up!" message

### Task 2: Progressive hint system and test results polish
1. Hints unlock progressively: first hint free, next after 3 min, final after 6 min
2. Show a "Get Hint" button with a countdown to next unlock
3. Test results panel: color-coded pass/fail badges, diff viewer for expected vs actual
4. Add a "Run Tests" button that runs without submitting (dry run)

### Verification
- [ ] Timer counts down and changes colors
- [ ] Hints unlock progressively
- [ ] "Run Tests" runs without submitting
- [ ] Test results show clear pass/fail with expected vs actual
- [ ] Build passes: `npx vite build`
