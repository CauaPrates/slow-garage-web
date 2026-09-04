# Slow Garage — Web

> **Your car. Your story. All in one place.**

Frontend for **Slow Garage**: a responsive web app and PWA for tracking everything about your cars — expenses, fill-ups, maintenance, issues, build projects, documents, and photos — replacing the spreadsheet you've been maintaining.

Talks directly to Supabase via `supabase-js`. There is no custom API layer; all authorization is enforced by Row Level Security on the backend. `docs/API_CONTRACT.md` and `src/types/database.types.ts` (generated, never hand-edited) are the only coupling to that backend.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite (Rolldown) |
| Styling | Tailwind CSS v4 |
| Components | Hand-written primitives (`src/components/ui`) + Radix UI primitives underneath the ones that need real accessible behavior (dialog, alert dialog, switch) |
| Data | `@supabase/supabase-js` + TanStack Query |
| Forms | `react-hook-form` + `zod` |
| Icons | Lucide |
| Hosting | Vercel |

Target cost for V1: **$0**. Vercel free tier, Supabase free tier, open-source libraries only. No paid APIs. No dependency gets installed without a real need — see `docs/DECISIONS.md` for every "we considered X, chose Y" call made along the way.

---

## Platform

Responsive web app + installable PWA. Mobile is not a stripped-down desktop:

**Mobile** — fast capture: fill-ups, expenses, maintenance, upgrades, photos, notes, via the bottom nav's central **Adicionar** sheet.
**Desktop** — dashboard, financial analysis, timeline, project management, via the sidebar.

---

## Prerequisites

- Node 20+
- A Supabase project (cloud or local) with the Slow Garage schema already applied

---

## Local setup

```bash
git clone <this-repo>
cd slow-garage-web

npm install
cp .env.example .env   # fill in the Supabase URL and anon key

npm run dev
```

App runs at `http://localhost:5173`.

---

## Environment variables

`.env.example`:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only the **anon key** ever belongs here. The `service_role` key must never reach the client — every `VITE_`-prefixed variable is bundled into the JavaScript and is publicly readable. If a feature seems to need `service_role`, the design is wrong; it does not belong in this repository.

If these variables are missing at build/runtime, the app renders a dedicated "Configuração do Supabase ausente" screen instead of crashing or showing a blank page (see `src/app` and ADR-008 in `docs/DECISIONS.md`).

---

## Scripts

```bash
npm run dev          # dev server
npm run build         # tsc -b && vite build — must pass before every commit
npm run preview       # serve the production build locally (for real perf/PWA testing)
npm run lint           # eslint
npm run types          # regenerate src/types/database.types.ts from the backend
npm run icons           # regenerate PWA icons from the source logo (scripts/generate-icons.mjs)
npm run ui:check        # Playwright + axe-core sweep (screenshots, overflow, a11y) — scripts/ui-check.mjs
```

There is no unit/integration test runner. Every feature is verified against a real Supabase dev database with disposable Playwright scripts (created, run, and deleted per phase) — see any `specs/*/verification.md` for the pattern and the literal evidence collected.

---

## Structure

```
src/
├── app/                  # router, providers, entry point, missing-config screen
├── components/
│   ├── ui/               # hand-written primitives (Button, Input, Dialog, Select...)
│   ├── layout/            # AppShell, Sidebar, BottomNav, AddActionSheet
│   └── shared/
├── features/              # one folder per domain area — hooks, schemas, and screens live together
│   ├── auth/
│   ├── vehicle/           # garage list + the vehicle dashboard page
│   ├── expense/
│   ├── fuel/
│   ├── maintenance/
│   ├── issue/
│   ├── project/
│   ├── document/          # documents, obligations, financing, photo gallery
│   ├── dashboard/         # get_vehicle_dashboard consumers (charts, summaries)
│   ├── timeline/          # unified timeline, notes, search
│   └── attachment/        # shared attachment (upload/view/remove) used by 4 entities
├── hooks/                 # useCurrentVehicleId, etc.
├── lib/                   # supabase client, format.ts, period.ts, navigation.ts, routes.ts...
├── types/
│   └── database.types.ts  # generated — never hand-written, never allowed to drift
└── styles/                # tokens.css (paleta "Rolê Noturno"), globals.css (Tailwind v4 @theme)
```

Each `features/<area>/` folder mixes data hooks, zod schemas, and the page/dialog components for that area — there is no separate `routes/` tree; routing lives entirely in `src/app/router.tsx` and `src/lib/routes.ts`.

---

## Navigation

**Desktop sidebar:** Dashboard · Minha garagem · Gastos · Abastecimentos · Manutenção · Problemas · Projetos · Histórico · Documentos · Configurações

**Mobile bottom nav:** Home · Carros · **Adicionar** · Dados · Configurações

The **Adicionar** button is visually prominent and opens a quick-action sheet: Gasto · Abastecimento · Manutenção · Upgrade · Foto · Nota.

---

## UX principles

1. Logging any event must be fast.
2. No long forms — optional fields are genuinely optional.
3. A few taps to record something, not a dozen.
4. Mobile is the priority, not an afterthought.
5. Every screen has real empty, loading, and error states, in Portuguese.
6. Avoid dense tables on mobile — cards, lists, timelines, charts.
7. Disabled nav/action items always show a visible text reason (never color-only, never `disabled` — `aria-disabled` so they stay reachable by keyboard).
8. Confirms, never celebrates — no animation for its own sake.

---

## Design

Dark-first, JDM/tuner-at-night ("Rolê Noturno": asphalt near-black `#121316` + street-light amber accent `#FF8A1E`), light mode fully supported and equally maintained. Full rationale, token values, and every rejected alternative are in `docs/DESIGN.md`; every non-obvious technical or product decision is in `docs/DECISIONS.md` (ADR-001 through the latest).

- No admin-dashboard look — cards, badges, hand-built charts, timeline, icons
- No horizontal overflow at any width, verified down to 320px on every screen
- Status colors (`--color-error`/`--color-warning`/`--color-success` in `src/styles/tokens.css`) are tuned to clear WCAG AA 4.5:1 against both a plain surface and their own 10%-tint badge background, in both themes — verified with a contrast calculation, not eyeballed (Fase 10)

Supported widths: 320, 390, 768, 1440px+ (screenshotted every phase).

---

## Data access

- All reads and writes go through `supabase-js`; there is no backend in this repository.
- Authorization is **never** implemented in the client. The UI hides what a user shouldn't see; RLS is what actually prevents access. IDs are never trusted from the URL as proof of ownership.
- Derived metrics (km/L, cost per km, monthly totals, project progress, financing balance) always come from database views/RPCs — never recomputed in the client. See `docs/API_CONTRACT.md`.
- Query keys are hierarchical (`['vehicles', vehicleId, ...]`) so a mutation can invalidate everything derived from it by prefix.

---

## Deploy

The app is a static SPA (Vite build output in `dist/`) — no server-side code. To deploy on Vercel:

1. `npm run build` must pass locally first.
2. On [vercel.com](https://vercel.com), **Add New Project** → import this Git repository. Vercel auto-detects the Vite framework preset.
3. Add the two environment variables in the Vercel project settings: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (same values as your local `.env`).
4. Deploy. `vercel.json` at the repo root already configures the SPA rewrite (`/(.*) → /index.html`) so deep links (e.g. `/v/:id/historico`) work on a hard refresh, not just client-side navigation.

Before merging any change to `dev`/`main`:

- [ ] `npm run build`, `tsc -b` (bundled into `build`), and `npm run lint` all clean
- [ ] Checked at 320px and at 1440px, both themes
- [ ] Empty, loading, and error states exist and show real Portuguese text

---

## Roadmap

Ten phases, each a full spec → plan → tasks → implement → verify cycle documented under `specs/NNN-slug/`. All ten are complete:

| Phase | Folder | Delivered |
|---|---|---|
| 0 | `000-foundation/` | Vite/TS/Tailwind/Router setup, Supabase client, design tokens, PWA shell, dark/light theme |
| 1 | `001-auth/` | Sign up, sign in, password reset, protected routes, session persistence |
| 2 | `002-garage/` | Vehicle CRUD, cover photo upload |
| 3 | `003-vehicle-shell/` | `/v/:vehicleId` shell, sidebar, bottom nav, Adicionar sheet, vehicle switcher |
| 4 | `004-expenses/` | Expense CRUD, category/period filters, attachments |
| 5 | `005-fuel/` | Fill-up logging, consumption metrics from views |
| 6 | `006-maintenance/` | Preventive plan, execution log, overdue/due-soon/history, alerts |
| 7 | `007-issues-projects/` | Issue status cycle, projects with items/budget/progress |
| 8 | `008-files/` | Documents, obligations, financing, photo gallery, generalized attachment model |
| 9 | `009-timeline-dashboard/` | Vehicle dashboard (`get_vehicle_dashboard`, charts), unified timeline, notes, search |
| 10 | `010-polish/` | Full a11y/overflow/empty-state sweep, Lighthouse performance + PWA audit, Vercel deploy prep |

Each `specs/NNN-slug/verification.md` has the literal command output that proves its acceptance criteria — not a claim, evidence.

---

## Out of scope for V1

AI/AI diagnostics, OCR, document or photo analysis, marketplace, shop/insurer/bank integrations, community/social features, rankings, WhatsApp, push notifications, native apps, offline writes, multi-user per vehicle, garage sharing, monetization, i18n, financial simulators.

The architecture leaves room for these later without carrying the complexity now.

---

## V1 success criteria

V1 is done when a user can register their car, log expenses and fill-ups quickly, track fuel economy, plan maintenance, manage build projects, browse the full timeline, store documents and photos, understand how much the car has cost so far, and do all of it comfortably from both phone and desktop.

In short: it has to actually replace the spreadsheet.

---

## Commit conventions

```
feat(expenses): add quick-entry sheet
fix(mobile): prevent horizontal overflow on vehicle card
chore(deps): bump vite
refactor(timeline): extract event row component
```

---

## License

Private. Personal use.
