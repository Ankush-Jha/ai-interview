# ROADMAP.md

> **Current Phase**: Phase 1
> **Milestone**: v1.0 — Production-Ready AI Interviewer

## Must-Haves (from SPEC)
- [x] PDF upload → AI question generation
- [x] Conversational AI orb with voice I/O
- [x] Follow-up questions and depth probing
- [ ] Open-source coding problem integration with test cases
- [ ] Polished UX (no rough edges, loading states, error handling)
- [ ] Reliable feedback reports with study recommendations

## Phases

### Phase 1: Conversational Flow Polish
**Status**: ✅ Complete
**Objective**: Make the AI interviewer feel like a real conversation — no buttons, no pauses, just natural voice flow
**Requirements**: REQ-03, REQ-04, REQ-05, REQ-07, REQ-08, REQ-09

Key deliverables:
- Intro greeting (getIntro)
- Auto-advance between questions (no Next button)
- Silence detection auto-submit (3s)
- Wrap-up summary (getWrapUp)
- Phase transitions between topics
- Follow-up question flow
- Hide scores during session

### Phase 2: Coding Interview Engine
**Status**: 🟡 In Progress
**Objective**: Full coding interview experience with DSA problems, test case runner, AI code review, AND a premium interview page redesign
**Requirements**: REQ-10, REQ-11, REQ-12

Key deliverables:
- **Interview page UI redesign** (dark theme, glassmorphism, premium feel)
- Open-source DSA problem bank (categorized by topic/difficulty)
- Monaco editor with syntax highlighting and autocomplete
- In-browser test case execution with pass/fail results
- AI evaluation of code quality, efficiency, and correctness
- Timer and hint system for coding questions

### Phase 3: Adaptive Intelligence
**Status**: ⬜ Not Started
**Objective**: AI adapts interview difficulty and topic selection in real-time based on performance
**Requirements**: REQ-06, REQ-14

Key deliverables:
- Real-time difficulty adjustment (go deeper on strong topics, pivot on weak)
- Topic mastery detection across the session
- Personalized study recommendations in report
- Question bank expansion based on detected gaps

### Phase 4: Production Polish
**Status**: ⬜ Not Started
**Objective**: Ship-quality UX, performance, reliability, and onboarding
**Requirements**: REQ-17, REQ-18

Key deliverables:
- Onboarding flow for first-time users
- Loading states, error handling, edge cases
- Performance optimization (lazy loading, code splitting)
- Clean up .next/ leftover, deduplicate deps
- Mobile-responsive interview experience
- Landing page / marketing
