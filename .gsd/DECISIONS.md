# DECISIONS.md — Architecture Decision Records

## ADR-001: Free-Tier-Only AI Stack

**Date**: 2026-02-16
**Status**: Accepted
**Context**: Need AI inference without paid API costs.
**Decision**: Use Groq API (free tier) for all LLM calls. Provides fast inference with Llama 3 and Mixtral models at zero cost.
**Consequences**: Rate-limited. May need fallback strategy if free tier is exhausted.

## ADR-002: Design System — shadcn/ui + Linear Aesthetic

**Date**: 2026-02-16
**Status**: Accepted
**Context**: Need premium UI without custom design system from scratch.
**Decision**: shadcn/ui components + Tailwind CSS + Inter font. Neutral palette, one accent color, generous whitespace. No gradients, glassmorphism, or flashy effects.
**Consequences**: Consistent, maintainable design. Components are copy-paste, fully customizable.

## ADR-003: Firebase Serverless Backend

**Date**: 2026-02-16
**Status**: Accepted
**Context**: Single developer, need auth + database without managing servers.
**Decision**: Firebase Auth + Cloud Firestore + Firebase Hosting. Cloud Functions only if needed.
**Consequences**: Fast to ship. Free tier limits apply (50K reads/day, 20K writes/day).

## ADR-004: Client-Side PDF Parsing

**Date**: 2026-02-16
**Status**: Accepted
**Context**: Need to extract text from uploaded PDFs.
**Decision**: Use pdf.js client-side. No server upload needed for text extraction.
**Consequences**: Works offline. Large PDFs may be slow. No OCR for scanned images (V1 limitation).
