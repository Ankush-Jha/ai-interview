# ROADMAP.md

> **Current Phase**: Phase 1 ✅ Complete
> **Milestone**: v1.0 — Core Interview Experience

## Must-Haves (from SPEC)

- [ ] PDF upload → parse → knowledge extraction
- [ ] Configurable interview setup (persona, difficulty, question types)
- [ ] Real-time Socratic AI interview with adaptive difficulty
- [ ] Voice input (STT) and voice output (TTS)
- [ ] Per-question scoring and feedback
- [ ] End-of-session debrief report
- [ ] Firebase Auth (multi-user)
- [ ] Session history with progress tracking
- [ ] Premium Linear-style UI

## Phases

### Phase 1: Foundation & Design System
**Status**: ✅ Complete
**Objective**: Project scaffold, auth, routing, and the complete design system — so every subsequent phase builds on a polished foundation.
**Deliverables**:
- Vite + React + TypeScript + Tailwind + shadcn/ui project setup
- Design tokens, theme config, base components
- Firebase Auth (email + Google sign-in)
- App shell: sidebar, header, responsive layout
- Routing: Dashboard, Configure, Session, Results, History, Settings
- Auth-protected routes

### Phase 2: Document Pipeline
**Status**: ✅ Complete
**Objective**: Students can upload PDFs and the system extracts, analyzes, and structures the content for interview generation.
**Deliverables**:
- PDF upload UI with drag-and-drop
- Client-side PDF parsing (pdf.js)
- Content analysis via Groq API (topic extraction, concept mapping, Bloom's level tagging)
- Document storage in Firestore (metadata + extracted text)
- Dashboard shows uploaded documents

### Phase 3: Interview Engine
**Status**: ✅ Complete
**Objective**: The core Socratic interview — AI generates questions from parsed content, conducts a conversational session, evaluates answers in real-time, and adapts difficulty.
**Deliverables**:
- Interview configuration UI (persona, difficulty, question count, types)
- Question generation via Groq API (contextual, multi-type)
- Conversational interview flow (one question at a time, follow-ups)
- Real-time answer evaluation with scoring + feedback
- Adaptive difficulty (ramp up / remediate based on performance)
- Session state management

### Phase 4: Voice Integration
**Status**: ⬜ Not Started
**Objective**: Hands-free interviewing — students speak answers, AI speaks questions. Natural, voice-first experience.
**Deliverables**:
- Web Speech API integration for speech-to-text (student answers)
- Text-to-speech for AI interviewer (browser TTS or free API)
- Voice controls (start/stop recording, replay)
- Fallback to text mode when voice unavailable
- Audio visual indicators (waveform, recording state)

### Phase 5: Reports, History & Polish
**Status**: ⬜ Not Started
**Objective**: Comprehensive session reports, cross-session progress tracking, and final UI polish.
**Deliverables**:
- End-of-session debrief (overall score, strengths, growth areas, recommendations)
- Per-question breakdown with linked lecture excerpts
- Session history list with filtering and search
- Cross-session progress tracking (score trends, topic mastery)
- PDF report export
- Final UI polish, accessibility audit, performance optimization
