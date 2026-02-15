# DECISIONS.md — Architectural Decision Records

> Log of key technical decisions and their rationale.

## ADR-001: Free-Tier AI via HuggingFace Model Chain
**Date**: 2026-02-15
**Decision**: Use HuggingFace Inference API (free tier) with 5-model fallback chain instead of paid APIs (OpenAI, Anthropic)
**Rationale**: Product is free for students. HF free tier provides sufficient inference for MVP. Model chain (DeepSeek → Qwen → Llama → Mixtral → Phi) ensures resilience.
**Trade-off**: Slower inference, less consistent quality vs GPT-4. Acceptable for student practice tool.

## ADR-002: Browser-Based Code Execution
**Date**: 2026-02-15
**Decision**: Run test cases in-browser (no server-side sandbox at scale)
**Rationale**: Server-side code execution at scale requires containers/VMs = cost. Browser sandbox is free and sufficient for test case verification.
**Trade-off**: Limited to JavaScript execution. Can't run compiled languages server-side without infrastructure cost.

## ADR-003: Web Speech API for Voice
**Date**: 2026-02-15
**Decision**: Use Web Speech API (browser-native) for both TTS and STT
**Rationale**: Free, no API keys needed. Chrome has best support.
**Trade-off**: Chrome-only reliability. Firefox/Safari support is limited. Acceptable for MVP.

## ADR-004: Open-Source Problem Sets
**Date**: 2026-02-15
**Decision**: Use open-source DSA problem sets instead of LeetCode API/scraping
**Rationale**: LeetCode API is not public. Scraping violates ToS. Open-source alternatives (Neetcode, freeCodeCamp datasets) are freely available.
**Trade-off**: Smaller problem bank. Can expand over time.

---

## Phase 1 Decisions

**Date:** 2026-02-15

### Scope
- Phase 1 includes BOTH: verify/fix the 9 existing changes AND add UX polish (thinking animations, typing indicators, transition animations)
- This is a full "make it feel real" pass, not just bug fixes

### Approach
- Test with live HuggingFace models (no mock mode)
- If HF free tier proves unreliable, pivot to other free API alternatives (Groq, Together.ai free tier, etc.)
- Chrome-only voice support is acceptable for Phase 1

### Constraints
- Must rely on API — no offline/mock mode needed
- Keep it free — no paid API subscriptions
