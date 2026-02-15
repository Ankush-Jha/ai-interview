---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Verify & Fix Conversational Flow

## Objective
Verify all 9 conversational fixes work end-to-end with live HF API, and fix any bugs found. This is the foundation — nothing else can be polished until the core flow works.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- src/pages/InterviewSession.jsx
- src/lib/conversation.js
- server/lib/hf-client.js

## Tasks

<task type="auto">
  <name>Start servers and run end-to-end interview flow</name>
  <files>
    src/pages/InterviewSession.jsx
    server/lib/hf-client.js
  </files>
  <action>
    1. Ensure both servers running (vite :5173, express :3001)
    2. Open browser to localhost:5173
    3. Upload a test PDF (or use existing session)
    4. Configure an interview (3 questions, medium difficulty)
    5. Start session and verify:
       - AI intro greeting speaks before first question
       - First question auto-speaks after intro
       - Mic auto-starts after AI finishes speaking
       - Silence detection triggers auto-submit (wait 3s)
       - AI evaluates and auto-advances to next question (no button)
       - Follow-up questions work when AI probes deeper
       - Phase transitions speak between different topics
       - Wrap-up speaks at end before navigating to results
       - Score badges NOT visible in chat during session
    6. Log any failures or bugs
    - Do NOT skip any verification step
    - Do NOT assume something works — test it empirically
  </action>
  <verify>Browser test: start interview, answer 3 questions, verify all phases fire</verify>
  <done>All 9 conversational fixes verified working OR bugs documented for fix</done>
</task>

<task type="auto">
  <name>Fix any bugs found during verification</name>
  <files>
    src/pages/InterviewSession.jsx
    src/lib/conversation.js
    src/hooks/useSpeechSynthesis.js
    src/hooks/useSpeechRecognition.js
  </files>
  <action>
    For each bug found in Task 1:
    1. Identify root cause in source
    2. Apply minimal fix
    3. Re-test the specific flow
    
    Common expected issues:
    - Race conditions between TTS ending and mic starting
    - Silence timer firing during AI speech
    - Interview context state not updating before next question speaks
    - getIntro/getTransition/getWrapUp API calls failing (HF downtime)
    
    - Do NOT rewrite large sections — minimal targeted fixes only
    - Do NOT change the conversation.js constraints (already tuned)
  </action>
  <verify>npx vite build passes AND manual re-test of fixed flows</verify>
  <done>All identified bugs fixed, build passes, flows re-verified</done>
</task>

## Success Criteria
- [ ] Interview starts with AI greeting
- [ ] Questions auto-advance without "Next" button
- [ ] Silence detection auto-submits after 3s
- [ ] Follow-up questions work (AI probes deeper)
- [ ] Wrap-up summary speaks before results page
- [ ] Build passes cleanly
