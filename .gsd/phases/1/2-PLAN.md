---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: UX Polish — Animations & Micro-interactions

## Objective
Add visual polish that makes the interview feel premium: smooth transitions between phases, thinking animations, typing indicators, and entrance/exit animations for chat bubbles.

## Context
- .gsd/SPEC.md
- .gsd/DECISIONS.md (Phase 1: scope includes UX polish)
- src/pages/InterviewSession.jsx
- src/index.css

## Tasks

<task type="auto">
  <name>Add chat bubble entrance animations</name>
  <files>
    src/pages/InterviewSession.jsx
    src/index.css
  </files>
  <action>
    1. Add CSS @keyframes for chat bubble entrance:
       - AI messages: slide-in from left with fade
       - User messages: slide-in from right with fade
       - Duration: 300ms, easing: ease-out
    2. Apply animation classes to ChatBubble component
    3. Add staggered animation delay for consecutive messages
    
    - Do NOT use JavaScript-based animations (CSS-only for performance)
    - Do NOT add exit animations (messages stay visible)
  </action>
  <verify>Visual check: new messages animate in smoothly when added to chat</verify>
  <done>Chat bubbles slide in with smooth entrance animation</done>
</task>

<task type="auto">
  <name>Add phase transition visual effects</name>
  <files>
    src/pages/InterviewSession.jsx
    src/index.css
  </files>
  <action>
    1. When AI transitions between topics (getTransition), show a subtle divider in chat:
       - Thin line with topic label (e.g., "— Switching to Behavioral —")
       - Fade-in animation
    2. When AI is "thinking" (evaluating phase):
       - Enhance the typing indicator dots with a subtle glow pulse
       - Add "Thinking..." label next to orb in header
    3. When silence countdown appears (3...2...1):
       - Add a circular progress ring around the countdown badge
       - Smooth animation from full circle to empty
    
    - Do NOT block the UI during transitions
    - Keep animations subtle — premium feel, not flashy
  </action>
  <verify>Visual check: transitions show topic divider, thinking state has glow, countdown has ring</verify>
  <done>All three visual enhancements render correctly</done>
</task>

<task type="auto">
  <name>Add AIOrb state-aware animations</name>
  <files>
    src/components/AIOrb.jsx
    src/index.css
  </files>
  <action>
    1. Enhance AIOrb with distinct visual states:
       - idle: gentle pulse (existing)
       - thinking: faster pulse with color shift to amber
       - speaking: expanding/contracting ring animation (sound wave effect)
       - listening: mic-active glow with green tint
    2. Add smooth transitions between states (300ms CSS transition)
    3. Ensure the orb in the header bar also reflects the current state
    
    - Do NOT change the orb size — only color/glow/animation
    - Do NOT add audio visualizer (keep it CSS-only)
  </action>
  <verify>Visual check: orb changes appearance for each state (idle/thinking/speaking/listening)</verify>
  <done>AIOrb has 4 distinct animated states with smooth transitions</done>
</task>

## Success Criteria
- [ ] Chat messages animate in (slide + fade)
- [ ] Topic transitions show labeled divider
- [ ] Thinking indicator has glow pulse
- [ ] Silence countdown has progress ring
- [ ] AIOrb has 4 distinct visual states
- [ ] All animations are CSS-only, smooth, and subtle
