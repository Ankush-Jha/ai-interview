---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Project Scaffold + Design System

## Objective
Set up the complete project foundation: Vite + React + TypeScript + Tailwind CSS + shadcn/ui. Configure the design system with tokens, typography, and base styles that match the Linear.app aesthetic defined in SPEC.md.

## Context
- .gsd/SPEC.md — Tech stack and design system requirements
- .env.local — Existing Firebase credentials (preserve this file)

## Tasks

<task type="auto">
  <name>Initialize Vite + React + TypeScript project</name>
  <files>
    package.json
    tsconfig.json
    tsconfig.app.json
    tsconfig.node.json
    vite.config.ts
    index.html
    src/main.tsx
    src/App.tsx
    src/vite-env.d.ts
  </files>
  <action>
    1. Run `npx -y create-vite@latest ./ --template react-ts` to scaffold in current directory
    2. Install core dependencies:
       - `npm install react-router-dom`
       - `npm install -D tailwindcss @tailwindcss/vite`
    3. Configure `vite.config.ts` with Tailwind plugin and path aliases (`@/` → `src/`)
    4. Update `tsconfig.app.json` with path alias: `"@/*": ["./src/*"]`
    5. Create minimal `src/App.tsx` with a "Hello World" placeholder
    6. Update `index.html`:
       - Title: "Viva — AI Interview Coach"
       - Add Inter font from Google Fonts
       - Add Lucide icons CDN (or install lucide-react)
    7. Preserve existing `.env.local` — do NOT overwrite
    - Avoid: Do not install Next.js or any SSR framework — this is pure SPA
    - Avoid: Do not use Create React App — use Vite only
  </action>
  <verify>npm run dev -- --port 5173 starts without errors; browser shows Hello World</verify>
  <done>Vite dev server runs, TypeScript compiles, React renders in browser</done>
</task>

<task type="auto">
  <name>Set up Tailwind CSS + shadcn/ui + design tokens</name>
  <files>
    src/index.css
    components.json
    src/lib/utils.ts
    tailwind.config.ts (if needed)
  </files>
  <action>
    1. Configure Tailwind in `src/index.css` with `@import "tailwindcss"` (v4 style) or `@tailwind` directives
    2. Initialize shadcn/ui: `npx -y shadcn@latest init`
       - Style: New York
       - Base color: Neutral
       - CSS variables: yes
    3. Install foundational shadcn/ui components:
       - `npx shadcn@latest add button card input label separator skeleton badge avatar dropdown-menu sheet dialog tabs toast sonner`
    4. Set up design tokens in `src/index.css`:
       - Neutral, sophisticated palette (think Linear.app)
       - Background: near-white (#FAFAFA or similar)
       - Foreground: near-black (#0A0A0A)
       - One subtle accent color (soft indigo or similar — NOT bright blue)
       - Muted surfaces, borders, ring colors
       - Card, popover, destructive color tokens
    5. Set Inter as default font in CSS:
       ```css
       body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
       ```
    6. Add base typography utilities if needed (text sizes, weights, tracking)
    - Avoid: No gradients, glassmorphism, neon accents
    - Avoid: No overly rounded corners (use rounded-lg max, not rounded-3xl)
    - Avoid: Heavy shadows — use subtle, soft borders instead
  </action>
  <verify>shadcn/ui Button renders correctly with neutral theme; no Tailwind errors in console</verify>
  <done>Design system configured: Inter font, neutral palette, shadcn/ui components installed and themed</done>
</task>

## Success Criteria
- [ ] `npm run dev` starts without errors
- [ ] TypeScript compiles with zero errors
- [ ] shadcn/ui components render with correct neutral theme
- [ ] Inter font loads and applies globally
- [ ] Path alias `@/` resolves correctly
