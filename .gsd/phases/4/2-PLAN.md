---
phase: 4
plan: 2
wave: 1
---

# Plan 4.2: AI Orb Component + Session Page Neo-Brut Redesign

## Objective
Create a visual AI presence — an animated orb that represents the interviewer. It breathes, pulses when speaking, listens when the student talks, and celebrates on good answers. Also redesign the Session page with neo-brut styling.

## Context
- src/pages/Session.tsx (current interview UI)
- src/index.css (animations defined in Plan 4.1)

## Tasks

<task type="auto">
  <name>AIOrb component</name>
  <files>src/components/AIOrb.tsx</files>
  <action>
    Create a standalone animated orb component with multiple states:

    **Visual Design**:
    - Base: circular div with radial gradient (violet center → dark edges)
    - Size: 120px default, configurable
    - Border: 3px solid foreground (brutalist)
    - Hard shadow: 6px 6px 0 black

    **States** (via prop `state`):
    - `idle`: gentle floating animation (translate Y ±6px, 3s cycle)
    - `thinking`: faster pulse + scale oscillation (0.95 → 1.05)
    - `speaking`: ripple rings emanating outward (3 concentric expanding circles)
    - `listening`: inner glow intensifies, subtle scale bump on voice input
    - `celebrating`: quick scale pop (1.0 → 1.2 → 1.0) + green flash

    **Implementation**:
    - Pure CSS animations via keyframes (defined in index.css from 4.1)
    - Inner pseudo-elements for the glow layers
    - Outer div for the ripple rings (position: absolute, pointer-events: none)
    - Use `data-state` attribute for CSS-driven state transitions

    **Props**: `state: 'idle' | 'thinking' | 'speaking' | 'listening' | 'celebrating'`, `size?: number`, `className?: string`
  </action>
  <verify>npx tsc -b --noEmit, visual check orb renders</verify>
  <done>AIOrb component with 5 animated states</done>
</task>

<task type="auto">
  <name>Session page redesign with orb + neo-brut</name>
  <files>src/pages/Session.tsx</files>
  <action>
    Redesign Session.tsx with the orb at center stage:

    **Layout** — vertically centered, conversation-focused:
    1. Top: minimal progress bar (thick, sharp, colored fill)
    2. Center: AIOrb (large, 140px) with state synced to interview phase
       - phase=loading → orb state=thinking
       - phase=ready → orb state=idle
       - phase=evaluating → orb state=thinking
       - Showing feedback with score ≥ 80 → celebrating for 2s then idle
       - Showing feedback with score < 80 → idle
    3. Below orb: question text in Space Grotesk, large, bold
    4. Topic + Bloom badges: border-2, uppercase, sharp corners
    5. Answer textarea: border-2, hard shadow, mono font placeholder
    6. Submit button: large, brutalist, w-full
    7. Feedback card: border-3, hard shadow-accent, score in huge mono font
       - Strengths: green left border accent
       - Gaps: amber left border accent
       - Follow-up: violet accent card
    8. Completed view: massive score (JetBrains Mono, text-6xl), trophy with brutalist border, stat cards with hard shadows

    **Micro-animations**:
    - Question appears with brutalist-appear animation
    - Feedback slides in from bottom
    - Score number counts up (simple counter animation via state)
  </action>
  <verify>Visual check, orb animates correctly, session flow works end-to-end</verify>
  <done>Session page is visually stunning with living AI orb</done>
</task>

## Success Criteria
- [ ] AIOrb renders with 5 distinct animated states
- [ ] Session page centers the orb as the visual focus
- [ ] All session UI elements follow neo-brut styling
- [ ] Smooth state transitions between interview phases
