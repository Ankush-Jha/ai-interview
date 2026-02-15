# JOURNAL.md — Development Journal

> Session-by-session log of progress, learnings, and context.

## 2026-02-15 — Project Initialization

**What happened:**
- Mapped existing codebase (136 source files, React 19 + Express + HuggingFace + Firebase)
- Wrote SPEC.md, REQUIREMENTS.md, ROADMAP.md
- Identified 7 technical debt items
- Phase 1 (Conversational Flow Polish) already partially implemented from previous sessions

**Key learnings:**
- HuggingFace free tier has intermittent downtime — 5-model fallback chain helps
- Chrome Web Speech API has TTS bugs requiring cancel-before-speak workaround
- Follow-up logic was broken because `doSubmit` ignored AI action types — fixed

**Context for next session:**
- Phase 1 is mostly done (9 fixes implemented in InterviewSession.jsx)
- Need to verify all 9 fixes work end-to-end
- Phase 2 (Coding Interview Engine) is next major milestone
