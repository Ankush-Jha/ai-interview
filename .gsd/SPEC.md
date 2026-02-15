# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision

An AI-powered Socratic oral exam coach that lets students upload their lecture materials (PDFs, notes), then conducts an adaptive, conversational mock interview — evaluating responses in real-time, probing weak spots, and delivering a detailed performance debrief. Built for students preparing for vivas, oral exams, and deep subject mastery.

## Goals

1. **Core Interview Loop** — Upload material → AI parses it → configurable Socratic interview → real-time scoring → session debrief
2. **Adaptive Intelligence** — Dynamically adjust difficulty based on student performance (ramp up on strong answers, remediate on weak ones)
3. **Voice-First Interaction** — Natural voice-based conversation with the AI interviewer using free speech APIs
4. **Multi-User Platform** — Firebase Auth, per-user history, progress tracking across sessions
5. **Premium Design** — Linear.app-quality UI with shadcn/ui, clean typography, generous whitespace, zero flashiness

## Non-Goals (Out of Scope — V1)

- Webcam / body language analysis
- AI avatar (visual character)
- Anki flashcard export
- Multi-language support
- Study group sharing
- Mobile native apps
- Filler-word detection / speech coaching
- Pre-interview warm-up quiz

## Users

**University students** preparing for oral exams, vivas, and interviews. They upload their lecture PDFs/notes and want realistic, challenging practice with instant feedback. Multi-user — each student has their own account and history.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + TypeScript + Vite | Fast dev, strong typing |
| Styling | Tailwind CSS + shadcn/ui | Premium components, Linear-style aesthetic |
| AI | Groq API (free tier) | Fast inference, free Llama/Mixtral models |
| Voice STT | Web Speech API | Free, built into browsers |
| Voice TTS | Web Speech API / free alternative | Zero-cost text-to-speech |
| PDF Parsing | pdf.js (client-side) | Free, no server needed |
| Auth | Firebase Auth | Google/email sign-in |
| Database | Cloud Firestore | Serverless, scales, free tier |
| Hosting | Firebase Hosting | Free tier, CDN |
| Backend | Firebase Cloud Functions (if needed) | Serverless, pay-per-use |

## Design System

- **Aesthetic**: Linear.app × Arc browser × Vercel dashboard
- **Palette**: Neutral/sophisticated with one subtle accent color
- **Typography**: Inter or system fonts, strong hierarchy
- **Spacing**: Extremely generous whitespace
- **Depth**: Subtle soft borders, minimal shadows
- **Icons**: Lucide (clean, functional)
- **States**: Perfect hover, transitions, loading states, micro-interactions
- **Responsive**: Mobile-first, fully accessible (ARIA, keyboard nav)
- **BANNED**: Gradients, glassmorphism, neumorphism, neon, glows, heavy shadows, overly rounded corners, cluttered layouts

## Constraints

- All AI APIs must be **free tier** (Groq, no paid OpenAI)
- All voice APIs must be **free** (Web Speech API or equiv)
- Firebase free tier (Spark plan)
- Single developer, fast iteration
- Must work in modern browsers (Chrome, Firefox, Safari)

## Success Criteria

- [ ] Student can upload a PDF and start an AI interview within 60 seconds
- [ ] AI asks contextual questions based on the uploaded material
- [ ] Interview adapts difficulty based on student performance
- [ ] Voice input/output works for hands-free interviewing
- [ ] End-of-session debrief with score breakdown and growth areas
- [ ] Multiple users can sign up, log in, and see their session history
- [ ] UI feels premium — passes the "would a designer be proud?" test
