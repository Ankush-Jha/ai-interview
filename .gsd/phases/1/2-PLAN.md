---
phase: 1
plan: 2
wave: 1
---

# Plan 1.2: Firebase Auth + Routing

## Objective
Set up Firebase Auth (email/password + Google sign-in) and React Router with protected routes. Users should be able to sign up, log in, and be redirected appropriately.

## Context
- .gsd/SPEC.md — Auth requirements
- .env.local — Firebase credentials (already exists)
- src/main.tsx — Entry point from Plan 1.1

## Tasks

<task type="auto">
  <name>Firebase SDK + Auth context</name>
  <files>
    src/lib/firebase.ts
    src/lib/auth.ts
    src/contexts/AuthContext.tsx
    src/hooks/useAuth.ts
  </files>
  <action>
    1. Install Firebase: `npm install firebase`
    2. Create `src/lib/firebase.ts`:
       - Initialize Firebase app with env vars (VITE_FIREBASE_*)
       - Export `app`, `auth` instances
    3. Create `src/lib/auth.ts`:
       - Export functions: `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle`, `signOut`
       - Use Firebase Auth methods (createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup)
    4. Create `src/contexts/AuthContext.tsx`:
       - AuthProvider component wrapping children
       - useEffect with onAuthStateChanged listener
       - Context value: { user, loading, error }
    5. Create `src/hooks/useAuth.ts`:
       - Custom hook that consumes AuthContext
       - Throws if used outside AuthProvider
    - Avoid: Do not store passwords or tokens manually — Firebase handles this
    - Avoid: Do not use Firebase Admin SDK (that's server-side)
  </action>
  <verify>AuthProvider wraps App without errors; useAuth hook returns { user: null, loading: false } when not logged in</verify>
  <done>Firebase Auth initialized, AuthContext provides user state, auth functions exported</done>
</task>

<task type="auto">
  <name>React Router + protected routes</name>
  <files>
    src/App.tsx
    src/pages/Login.tsx
    src/pages/Signup.tsx
    src/pages/Dashboard.tsx
    src/components/ProtectedRoute.tsx
  </files>
  <action>
    1. Set up React Router in `src/App.tsx`:
       - BrowserRouter wrapping routes
       - AuthProvider wrapping BrowserRouter
    2. Define routes:
       | Path | Component | Auth |
       |------|-----------|------|
       | /login | Login | Public |
       | /signup | Signup | Public |
       | / | Dashboard | Protected |
       | /configure | (stub) | Protected |
       | /session/:id | (stub) | Protected |
       | /results/:id | (stub) | Protected |
       | /history | (stub) | Protected |
       | /settings | (stub) | Protected |
    3. Create `src/components/ProtectedRoute.tsx`:
       - If loading: show skeleton/spinner
       - If no user: redirect to /login
       - If user: render children (Outlet)
    4. Create basic `src/pages/Login.tsx`:
       - Email + password inputs (shadcn/ui Input, Label, Button)
       - Google sign-in button
       - Link to /signup
       - Error display (sonner toast)
       - Redirect to / on success
    5. Create basic `src/pages/Signup.tsx`:
       - Full name, email, password inputs
       - Google sign-in button
       - Link to /login
       - Redirect to / on success
    6. Create stub `src/pages/Dashboard.tsx`:
       - Just an h1: "Dashboard" with user email displayed
       - Sign out button
    - Avoid: Do not build full page UIs yet — just functional auth flow
    - Avoid: Do not add complex form validation yet (V1 polish)
  </action>
  <verify>Navigate to /login → sign up with email → redirected to Dashboard showing email → sign out → back to /login</verify>
  <done>Auth flow works end-to-end: signup, login, Google sign-in, protected routes, sign out</done>
</task>

## Success Criteria
- [ ] Firebase initializes without errors using .env.local credentials
- [ ] Email/password signup + login works
- [ ] Google sign-in works
- [ ] Unauthenticated users redirected to /login
- [ ] Authenticated users see Dashboard with their email
- [ ] Sign out returns to /login
