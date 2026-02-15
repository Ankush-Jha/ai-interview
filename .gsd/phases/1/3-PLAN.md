---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: API Resilience & Error UX

## Objective
Ensure the interview doesn't break when HF models are slow or down. Add graceful error handling, retry UX, and fallback behavior so the user never sees a blank screen or cryptic error.

## Context
- .gsd/SPEC.md
- .gsd/DECISIONS.md (if HF unreliable, explore alternatives)
- server/lib/hf-client.js
- src/pages/InterviewSession.jsx
- src/lib/conversation.js

## Tasks

<task type="auto">
  <name>Add graceful error handling in InterviewSession</name>
  <files>
    src/pages/InterviewSession.jsx
    src/lib/conversation.js
  </files>
  <action>
    1. When evaluateAndDecide fails:
       - Show friendly message in chat ("I had a hiccup — let me try that again")
       - Auto-retry once after 2 seconds
       - If retry fails: offer "Skip this question" and "Try again" buttons
       - Never show raw error messages to user
    2. When getIntro/getTransition/getWrapUp fails:
       - Use hardcoded fallback text (e.g., "Let's begin!" for intro)
       - Log error but don't block the flow
    3. Add a connection status indicator:
       - Small dot in header: green (connected), amber (slow), red (error)
       - Based on last API response time / error state
    
    - Do NOT add retry loops that could spam the API
    - Maximum 1 auto-retry, then user-driven
  </action>
  <verify>Simulate API failure by temporarily pointing to invalid model; verify graceful handling</verify>
  <done>API failures show friendly messages, retry once, then offer user actions</done>
</task>

<task type="auto">
  <name>Add API response timeout and loading states</name>
  <files>
    src/pages/InterviewSession.jsx
    server/lib/hf-client.js
  </files>
  <action>
    1. In InterviewSession, if evaluation takes > 15 seconds:
       - Show "Taking longer than usual..." in thinking indicator
       - After 30 seconds: show "AI is having trouble. Skip or retry?"
    2. In hf-client.js:
       - Reduce timeout from 120s to 60s (faster fallback to next model)
       - Add response time logging for monitoring
    3. Add a subtle loading bar at the top of the session during API calls
    
    - Do NOT change the model chain order
    - Do NOT add caching (Phase 4 concern)
  </action>
  <verify>Set timeout to 5s temporarily and verify timeout messages appear correctly</verify>
  <done>Long API calls show progressive loading states, timeout at 60s with user options</done>
</task>

## Success Criteria
- [ ] API failures show friendly chat messages (not raw errors)
- [ ] Auto-retry once, then user-driven skip/retry
- [ ] Intro/transition/wrapup have hardcoded fallbacks
- [ ] Long responses show "Taking longer..." message
- [ ] Connection status dot in header
- [ ] Build passes cleanly
