# Plan 2.4: Interview Session UI Redesign

## Objective
Complete visual overhaul of the InterviewSession page — make it feel premium, modern, and alive. The current layout feels like a basic chat app. Redesign everything: header, chat area, input zone, code editor split, sidebar.

## Context
@file src/pages/InterviewSession.jsx (950 lines — the main page)
@file src/components/CodeEditor.jsx (Monaco editor panel)
@file src/components/AIOrb.jsx (animated orb)
@file src/index.css (animations and utilities)

## Why
The interview page is the CORE experience — it's where students spend 90% of their time. If it looks basic, the whole product feels amateur. A premium design builds confidence and makes practice sessions feel valuable.

## Design Direction
- **Dark/midnight theme** for the interview zone (like a coding IDE — immersive, focused)
- **Glassmorphism panels** with subtle borders and backdrop blur
- **Prominent AI Orb** as the visual anchor (larger, centered during speaking)
- **Premium typography** — Inter or similar, clear hierarchy
- **Micro-interactions everywhere** — hover states, transitions, loading states
- **Split-pane for coding** — dark code editor left, conversation right (or vice versa)
- **Progress bar** instead of dots — smooth, animated, color-coded

## Tasks

### Task 1: Redesign interview page layout and header
1. Replace white/plain header with a dark glassmorphic top bar
2. Replace progress dots with a smooth animated progress bar
3. Redesign timer with a circular ring (like the countdown) instead of plain text
4. Make the AI Orb more prominent in the header (larger, with state label)
5. Dark/midnight background for the entire page (`bg-slate-950`)
6. Chat area with subtle dark cards instead of white bubbles on white background
7. AI messages: dark glass cards with teal accent border
8. User messages: primary gradient background
9. Add a subtle grid/dot pattern background for depth

### Task 2: Redesign input zone and controls
1. Glassmorphic input bar with frosted glass effect
2. Animated microphone button — pulsing ring when listening, glowing when active
3. Text input with auto-resize and premium focus ring
4. Skip/Pause buttons with icon + label, translucent styling
5. Silence countdown integrated into the mic button (ring around it)
6. Submit button with gradient and hover scale effect
7. Voice waveform visualization (bars or sine wave) during voice input

### Task 3: Redesign code editor split and sidebar
1. Seamless dark split-pane with drag handle
2. Code editor header with language selector pill, run/submit buttons
3. Test results panel redesign: dark cards with green/red status badges
4. Sidebar redesign: question list as vertical stepper with icons
5. Mobile-responsive: stack chat above code editor on small screens

### Verification
- [ ] Page looks premium on first glance (dark theme, glass effects)
- [ ] All interactive elements have hover/focus states
- [ ] Chat bubbles animate on entry
- [ ] Code editor split is clean and responsive
- [ ] Build passes: `npx vite build`
