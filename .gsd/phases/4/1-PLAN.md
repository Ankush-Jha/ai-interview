---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Neo-Brutalist Design System Overhaul

## Objective
Transform the entire visual identity from clean/minimal Linear-style to a bold neo-brutalist aesthetic. This means: thick borders, sharp corners, raw typography, vivid accent colors, heavy shadows, bold contrast, and energetic micro-animations.

## Context
- src/index.css (current shadcn oklch token system)
- src/components/layout/AppLayout.tsx, Sidebar.tsx, Header.tsx
- src/pages/Login.tsx, Signup.tsx
- Current: Inter font, 0.625rem radius, soft borders, neutral palette

## Neo-Brutalist Design Tokens

**Font Stack**:
- Display / headings: `"Space Grotesk"` (Google Fonts — geometric, bold, techy)
- Body: `"Inter"` (stays for readability)
- Mono / code: `"JetBrains Mono"` (for scores, data)

**Color Palette (oklch)**:
- Background: off-white `oklch(0.97 0.01 90)` / dark: near-black `oklch(0.13 0.02 260)`
- Foreground: hard black `oklch(0.1 0 0)` / dark: pure white `oklch(0.99 0 0)`
- Primary accent: electric violet `oklch(0.65 0.3 290)` — bold, unmissable
- Secondary accent: hot yellow `oklch(0.9 0.18 95)` — neo-brut signature
- Destructive: raw red `oklch(0.6 0.28 25)`
- Success: neon green `oklch(0.75 0.2 145)`
- Border: heavy `oklch(0.1 0 0)` in light / `oklch(0.85 0 0)` in dark (visible, thick)
- Card: pure white `oklch(1 0 0)` / dark: charcoal `oklch(0.18 0.01 260)`

**Brutalist Rules**:
- `--radius`: `0` (sharp corners everywhere, or 2px max)
- Border width: 2px default, 3px for cards
- Box shadows: hard offset (4px 4px 0 black), no blur
- Buttons: filled bg + thick border + hard shadow, uppercase bold text
- Hover: shadow shifts to (2px 2px 0) — "pressed" feel
- Active/focus: thick ring, high contrast

## Tasks

<task type="auto">
  <name>Google Fonts + CSS custom properties overhaul</name>
  <files>index.html, src/index.css</files>
  <action>
    1. Add Google Fonts link to index.html:
       - Space Grotesk (500, 600, 700)
       - JetBrains Mono (500, 600)
       - Inter already loaded

    2. Rewrite src/index.css:
       - Update @theme: add --font-display, --font-mono
       - Set --radius to 0px (or 2px)
       - Replace all oklch color tokens with neo-brut palette (see above)
       - Add CSS custom properties for:
         - --shadow-brutal: 4px 4px 0px var(--foreground)
         - --shadow-brutal-sm: 2px 2px 0px var(--foreground)
         - --shadow-brutal-accent: 4px 4px 0px var(--primary)
       - Add border-width utility: default 2px
       - Update dark mode tokens with same energy (high contrast, thick borders, violet primary)
       - Add base layer styles:
         - All cards: border-2, hard shadow
         - Buttons: uppercase, font-bold, tracking-wider
         - Inputs: border-2, no rounded corners
         - Focus rings: thick, visible (3px offset)
       - Add keyframe animations:
         - `float` (for orb — gentle y-axis bob)
         - `pulse-ring` (expanding ring for voice recording)
         - `brutalist-appear` (translate + opacity for page transitions)
  </action>
  <verify>Dev server renders with new styles, no CSS errors</verify>
  <done>index.css fully rewritten with neo-brut tokens, fonts loaded, animations defined</done>
</task>

<task type="auto">
  <name>Sidebar + Header + AppLayout neo-brut restyle</name>
  <files>src/components/layout/AppLayout.tsx, Sidebar.tsx, Header.tsx</files>
  <action>
    **AppLayout.tsx**:
    - Sidebar: border-r-2 or border-r-3 (heavy divider)
    - Background: bg-background with subtle texture via CSS (optional dot pattern)

    **Sidebar.tsx**:
    - Logo: replace rounded-lg with sharp square, thick border, hard shadow
    - Brand name "Viva": use font-display (Space Grotesk), text-xl font-bold uppercase tracking-wide
    - Nav items: sharp corners, border-2 on active, hard shadow on hover
    - Active state: bg-primary text-primary-foreground border-2, hard shadow
    - User section: bold avatar with thick border ring, uppercase label

    **Header.tsx**:
    - border-b-2 (thick bottom border)
    - Title: font-display, uppercase, tracking-wider, font-bold
    - User dropdown trigger: thick border ring avatar
    - Remove backdrop-blur — neo-brut is opaque, not glassy
  </action>
  <verify>npx tsc -b --noEmit, visual check in dev server</verify>
  <done>Shell components have bold neo-brutalist look</done>
</task>

<task type="auto">
  <name>Login + Signup pages neo-brut restyle</name>
  <files>src/pages/Login.tsx, src/pages/Signup.tsx</files>
  <action>
    **Login.tsx**:
    - Outer: add subtle dot-grid background pattern (CSS background-image)
    - Card wrapper: border-3, hard shadow, sharp corners
    - "Welcome back" → Space Grotesk, text-3xl, font-bold, uppercase
    - Inputs: border-2, sharp, bg-background
    - "Sign in" button: bg-primary, text-primary-foreground, uppercase, border-2 border-foreground, hard shadow, hover:translate + shadow shift
    - Google button: same brutalist treatment
    - Error: border-2 border-destructive, hard shadow with destructive color

    **Signup.tsx**: mirror Login styling
  </action>
  <verify>Visual check, both pages render with neo-brut aesthetic</verify>
  <done>Auth pages are bold and striking</done>
</task>

<task type="auto">
  <name>Dashboard + Configure pages neo-brut restyle</name>
  <files>src/pages/Dashboard.tsx, src/pages/Configure.tsx</files>
  <action>
    **Dashboard.tsx**:
    - Welcome heading: Space Grotesk, uppercase, font-bold
    - Quick action card: border-3, hard shadow, hover: shadow shift + slight translate
    - Document cards: border-2, hard shadow, delete button with destructive border on hover
    - Session cards: bold score numbers in mono font (JetBrains), thick colored left border accent
    - Badges: sharp corners, border-2, uppercase text

    **Configure.tsx**:
    - FileDropzone integration: update FileDropzone to use border-2 dashed, hard shadow
    - Analysis result cards: thick borders, bold topic badges
    - "Start Interview" button: large, bg-primary, brutalist shadow, uppercase
  </action>
  <verify>Visual check, dashboard and configure match neo-brut style</verify>
  <done>Core pages restyled</done>
</task>

## Success Criteria
- [ ] All color tokens replaced with neo-brut palette
- [ ] Space Grotesk + JetBrains Mono loaded and used
- [ ] Sharp corners, thick borders, hard shadows throughout
- [ ] Login, Dashboard, Configure, Sidebar, Header all restyled
- [ ] Both light and dark mode work with high contrast
