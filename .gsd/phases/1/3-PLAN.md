---
phase: 1
plan: 3
wave: 2
---

# Plan 1.3: App Shell + Page Stubs

## Objective
Build the full application layout shell (sidebar navigation + header) and create styled page stubs for all routes. After this plan, the app looks and feels like a real product — every page exists, navigation works, and the design is polished.

## Context
- .gsd/SPEC.md — Design system requirements (Linear.app aesthetic)
- src/App.tsx — Router from Plan 1.2
- src/components/ui/ — shadcn/ui components from Plan 1.1

## Tasks

<task type="auto">
  <name>App layout shell — sidebar + header</name>
  <files>
    src/components/layout/AppLayout.tsx
    src/components/layout/Sidebar.tsx
    src/components/layout/Header.tsx
  </files>
  <action>
    1. Create `src/components/layout/Sidebar.tsx`:
       - Fixed left sidebar (w-60 on desktop, collapsible sheet on mobile)
       - App logo/name at top: "Viva" in clean typography
       - Navigation items with Lucide icons:
         - Dashboard (LayoutDashboard)
         - New Interview (Plus)
         - History (Clock)
         - Settings (Settings)
       - Active state: subtle background, text accent color
       - Hover state: smooth transition
       - User section at bottom: avatar, name, sign out
       - Border-right for separation (no shadow)
       - Install lucide-react: `npm install lucide-react`
    2. Create `src/components/layout/Header.tsx`:
       - Sticky top bar within main content area
       - Page title (dynamic, based on current route)
       - Right side: user avatar dropdown (shadcn/ui DropdownMenu)
       - Mobile: hamburger menu to open sidebar sheet
       - Clean, minimal — just text and icons, no backgrounds
    3. Create `src/components/layout/AppLayout.tsx`:
       - Flex container: Sidebar + main content area
       - Main area: Header + scrollable content (Outlet)
       - Responsive: sidebar hidden on mobile, sheet overlay
       - Generous padding on content area
    4. Update `src/App.tsx`:
       - Wrap protected routes with AppLayout
       - Login/Signup routes render WITHOUT AppLayout
    - Avoid: Heavy shadows on sidebar — use a 1px border
    - Avoid: Colorful sidebar backgrounds — keep it white/neutral
    - Avoid: Too many nav items — keep it minimal (4-5 max)
  </action>
  <verify>App renders with sidebar + header; clicking nav items changes routes; mobile menu works</verify>
  <done>Responsive app shell with sidebar navigation, header, and route switching</done>
</task>

<task type="auto">
  <name>Styled page stubs for all routes</name>
  <files>
    src/pages/Dashboard.tsx (update)
    src/pages/Configure.tsx (new)
    src/pages/Session.tsx (new)
    src/pages/Results.tsx (new)
    src/pages/History.tsx (new)
    src/pages/Settings.tsx (new)
  </files>
  <action>
    1. Update `src/pages/Dashboard.tsx`:
       - Welcome message with user's display name
       - 2-3 empty state cards (shadcn/ui Card):
         - "Start New Interview" — CTA card with Plus icon
         - "Recent Sessions" — empty state with illustration text
         - Quick stats placeholder: "Complete your first interview to see stats"
       - Clean layout with generous spacing
    2. Create `src/pages/Configure.tsx`:
       - Heading: "Configure Interview"
       - Empty state: "Upload a document to configure your interview"
       - Placeholder for upload area
    3. Create `src/pages/Session.tsx`:
       - Heading: "Interview Session"
       - Empty state: "No active session"
    4. Create `src/pages/Results.tsx`:
       - Heading: "Session Results"
       - Empty state: "No results to display"
    5. Create `src/pages/History.tsx`:
       - Heading: "Interview History"
       - Empty state: "No interviews yet. Start your first one!"
    6. Create `src/pages/Settings.tsx`:
       - Heading: "Settings"
       - User profile section (display name, email — read-only for now)
       - Sign out button
    - Each page should use consistent layout:
       ```tsx
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-semibold tracking-tight">Page Title</h1>
           <p className="text-sm text-muted-foreground">Description</p>
         </div>
         {/* Content */}
       </div>
       ```
    - Avoid: Building full features — these are styled stubs only
    - Avoid: Different page layouts — consistency is key
  </action>
  <verify>All routes render correct page stubs; navigation between pages is smooth; no 404s</verify>
  <done>All 6 pages render with consistent styling, proper headings, and empty states</done>
</task>

<task type="checkpoint:human-verify">
  <name>Visual review of complete app shell</name>
  <files>N/A</files>
  <action>
    Launch dev server and take screenshots of:
    1. Login page
    2. Dashboard (after auth)
    3. Sidebar navigation with all items
    4. Mobile responsive view
    Present to user for design approval.
  </action>
  <verify>User confirms the design matches Linear.app aesthetic expectations</verify>
  <done>User approves the visual direction</done>
</task>

## Success Criteria
- [ ] App shell renders with sidebar + header on all protected routes
- [ ] All 6 page stubs are accessible via navigation
- [ ] Sidebar highlights active route
- [ ] Mobile hamburger menu opens/closes sidebar
- [ ] Typography uses Inter font with clear hierarchy
- [ ] Design feels premium, neutral, and minimal — no flashy elements
- [ ] Login/Signup pages render without app shell
