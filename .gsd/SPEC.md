# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
A free, voice-first AI interviewer for students. Upload your resume/notes PDF, pick your interview style, and a conversational AI orb conducts a realistic mock interview — asking probing follow-ups, opening coding problems with test-case verification, gauging depth of understanding across topics, and delivering actionable feedback. Feels like sitting across from a real senior engineer, not a quiz app.

## Goals
1. **Natural conversational interview** — AI orb speaks, listens, probes deeper with follow-ups, detects topic mastery vs gaps
2. **Coding interview mode** — Open-source LeetCode-style DSA problems with in-browser editor, test case execution, and AI-verified solutions
3. **Depth assessment** — AI adapts questions based on answers, going deeper on strong topics and pivoting on weak ones
4. **Actionable feedback** — Post-interview report with scores, strengths, improvement areas, and specific study recommendations
5. **Production-ready product** — Real users (students), free tier, reliable, polished UX

## Non-Goals (Out of Scope)
- Payment/subscriptions — entirely free
- Multiplayer / mock with friends
- Native mobile app (web-only, mobile-responsive)
- Proprietary LeetCode API integration (use open-source problem sets)
- Enterprise features (team management, analytics dashboards)

## Users
Students preparing for technical interviews — CS undergrads, bootcamp grads, career switchers. Entry to mid-level. They want realistic practice without paying for expensive platforms.

## Constraints
- **Cost**: Zero ongoing cost for AI — use free-tier HuggingFace Inference API with model chain fallback
- **Coding problems**: Open-source/free DSA problem sets only (no LeetCode scraping)
- **Code execution**: Browser-based test case runner (no server-side sandboxing for user code at scale)
- **Voice**: Web Speech API only (no paid TTS/STT services)
- **Auth**: Firebase free tier (Spark plan)
- **Database**: Firestore free tier

## Success Criteria
- [ ] User can upload PDF and start interview within 60 seconds
- [ ] AI asks 5-10 questions with natural follow-ups and topic transitions
- [ ] Coding questions include a Monaco editor with runnable test cases
- [ ] AI voice output works reliably on Chrome (primary target)
- [ ] Silence detection auto-submits voice answers
- [ ] Post-interview report shows per-question scores and study recommendations
- [ ] Session history persists across logins
- [ ] App loads under 3 seconds on broadband
