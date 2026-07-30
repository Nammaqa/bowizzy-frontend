# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

BoWizzy — a React SPA for resume building, AI-assisted resume generation, portfolio creation, LinkedIn optimization, and mock interview prep/practice.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc -b type-check, then vite build (both must pass — build fails on TS errors)
npm run lint      # eslint .
npm run preview   # preview the production build
```

There is no test runner configured in this repo (no test script, no test files). Don't assume Jest/Vitest is present.

## Architecture

### Stack
React 19 + TypeScript, Vite 7 (with `babel-plugin-react-compiler` and `vite-plugin-pwa`), React Router v7 (`createBrowserRouter`, data-router API), Tailwind CSS v4 (via `@tailwindcss/vite`, no `tailwind.config`), shadcn/ui (`components.json`, "new-york" style, aliases below), `@react-pdf/renderer` for PDF export, Axios for HTTP.

Path alias: `@` → `src` (configured in both `vite.config.ts` and `tsconfig.app.json`). shadcn aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`, `@/lib/utils`.

### Routing & auth (`src/App.tsx`)
All routes are declared as one flat array passed to `createBrowserRouter` — there is no nested route config or separate router file. Auth is homegrown, not a library:
- `isAuthenticated()` checks `localStorage.getItem("user")` for a parsed object with a `token`.
- `ProtectedRoute` / `PublicOnlyRoute` wrap route components to redirect based on auth state.
- Authenticated pages are wrapped in `LayoutWrapper`, which renders the sidebar (`components/ui/sidebar.tsx`) and hides it on the portfolio editor route.
- `AuthPopstateGuard` (mounted once, globally) forces a hard redirect to `/login` on back/forward navigation or bfcache restore if the user is no longer authenticated — this exists specifically to prevent stale protected pages from flashing after logout.
- `clearHistoryAndLogout()` clears `localStorage` and floods `window.history` with `/login` entries before reloading, to bury protected pages so back-navigation can't reach them.
- New protected pages must follow the existing `ProtectedRoute > LayoutWrapper > Page` pattern; new sidebar entries go in the `careerMap` / `interviews` / `bowizzy` arrays near the top of the file.

### Feature areas (`src/pages/`)
Pages are grouped into parenthesized directories that don't affect routing, only organization: `(ResumeBuilder)`, `(AIResumeBuilder)`, `(Portfolio)`, `(Profile)`, `(InterviewPrep)`, `(Interviews)/MockInterview`, `(LinkedInOptimization)`. Each groups its own `components/` (and sometimes `forms/`, `ui/`) subfolder alongside its top-level pages.

### Two parallel resume-template systems
There are two independently maintained template registries — don't conflate them:
- `src/templates/templateRegistry.ts` — manual resume builder templates (`TEMPLATE_REGISTRY`, ids `template1`…`template20`). Currently only templates 11–20 are registered; 1–10 are commented out but the display/pdf components still exist on disk. Each entry pairs a `displayComponent` (screen preview) with a `pdfComponent` (`@react-pdf/renderer` document) and metadata (`supportsPhoto`, `pageCount`, thumbnail path).
- `src/pages/(AIResumeBuilder)/templates/aiTemplateRegistry.ts` — AI resume builder templates (`aiTemplateRegistry`, ids `ai-1`…`ai-9`). Components are lazy-loaded (`React.lazy`); each entry also carries an `importPdf()` for on-demand PDF generation.

When adding a new template to either system: create matching `Display` and `PDF` components (in `templates/display/` and `templates/pdf/` under the relevant directory), then register both in the corresponding registry — the registry is the single source of truth consumed by selection UIs and preview/export logic.

### Data model
`src/types/resume.ts` defines the canonical resume shape (`PersonalDetails`, `EducationDetails`, `WorkExperience`, etc.) shared across the manual resume builder, templates, and PDF renderers. The AI resume builder has its own shape in `src/pages/(AIResumeBuilder)/types.ts` and converts into the shared shape via `mapInfoJsonToResumeData.ts`.

### Services layer (`src/services/`)
Thin API wrappers around the shared `api` Axios instance (`src/api.tsx`, baseURL from `VITE_API_BASE_URL`, default `http://localhost:5000`). Mixed `.js`/`.ts` files coexist — match the existing file's extension when editing rather than converting it. Auth is passed explicitly: every authenticated call takes `(userId, token, ...)` and sets `Authorization: Bearer ${token}` per-request; there is no Axios interceptor or auth context doing this implicitly. `token`/`user` come from `localStorage` (see `App.tsx`'s `isAuthenticated`), not React context.

### Environment variables
Vite env vars (`VITE_*`, in `.env`) configure: Razorpay keys, Cloudinary (cloud name/key/upload preset), Grok/Gemini API keys, and pricing constants (`VITE_BASE_RESUME_PRICE`, `VITE_MOCK_INTERVIEW_PRICE`, etc.). `VITE_API_BASE_URL` is commented out by default (falls back to localhost:5000).

### Deployment
Deployed via Vercel (`vercel.json`): SPA fallback rewrites everything without a file extension to `/index.html`; `/resume-templates/*` assets get long-lived cache headers.
