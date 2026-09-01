# Garage App — Web

> **Your car. Your story. All in one place.**

Frontend for **Garage App**: a responsive web app and PWA for tracking everything about your cars — expenses, fill-ups, maintenance, issues, build projects, documents, and photos — replacing the spreadsheet you've been maintaining.

Talks directly to Supabase via `supabase-js`. There is no custom API layer; all authorization is enforced by Row Level Security in the [`garage-app-backend`](https://github.com/<user>/garage-app-backend) repository.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Icons | Lucide |
| Data | `@supabase/supabase-js` |
| Hosting | Vercel |

Target cost for V1: **$0**. Vercel free tier, Supabase free tier, open-source libraries only. No paid APIs.

No dependency gets installed without a real need. No abstraction gets built before there's a second use case.

---

## Platform

Responsive web app + PWA, expected to work well on phone, tablet, laptop, and desktop.

Mobile is not a stripped-down desktop. The two have different jobs:

**Mobile** — fast capture: fill-ups, expenses, maintenance, upgrades, photos, notes.
**Desktop** — dashboard, financial analysis, history, projects, vehicle management.

---

## Prerequisites

- Node 20+
- A running Supabase instance — either the local one from `garage-app-backend` (`supabase start`) or a cloud project

---

## Local setup

```bash
git clone git@github.com:<user>/garage-app-web.git
cd garage-app-web

npm install
cp .env.example .env   # fill in the Supabase URL and anon key

npm run dev
```

App runs at `http://localhost:5173`.

---

## Environment variables

`.env.example`:

```dotenv
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=
```

Only the **anon key** ever belongs here. The `service_role` key must never reach the client — every `VITE_`-prefixed variable is bundled into the JavaScript and is publicly readable.

---

## Scripts

```bash
npm run dev          # dev server
npm run build        # production build
npm run preview      # serve the production build locally
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format       # prettier
```

---

## Structure

```
src/
├── app/                  # entry point, providers, router
├── routes/               # one folder per screen
│   ├── auth/
│   ├── garage/
│   ├── vehicle/
│   │   ├── dashboard/
│   │   ├── expenses/
│   │   ├── fuel/
│   │   ├── maintenance/
│   │   ├── issues/
│   │   ├── projects/
│   │   ├── timeline/
│   │   └── documents/
│   └── settings/
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # sidebar, bottom nav, app shell
│   └── shared/           # cards, badges, empty states, charts
├── features/             # domain logic per area (hooks, queries, schemas)
├── lib/
│   ├── supabase.ts       # client
│   ├── format.ts         # currency, dates, mileage
│   └── utils.ts
├── hooks/
├── types/
│   └── database.types.ts # generated from the backend
└── styles/
```

Types come from the backend repo (`supabase gen types typescript`) and are kept in sync — never hand-written and never allowed to drift.

---

## Navigation

**Desktop sidebar:** Dashboard · My garage · Expenses · Fill-ups · Maintenance · Issues · Projects · History · Documents · Settings

**Mobile bottom nav:** Home · Cars · **Add** · Data · Settings

The **Add** button is visually prominent and opens a quick-action sheet: Expense · Fill-up · Maintenance · Upgrade · Photo · Note.

---

## UX principles

1. Logging any event must be fast.
2. No long forms.
3. Optional fields are genuinely optional.
4. A few taps to record something, not a dozen.
5. It should feel like a modern automotive product, not an ERP.
6. Mobile is the priority, not an afterthought.
7. Every screen has real empty, loading, and error states.
8. Avoid dense tables on mobile — use cards, lists, timelines, and charts.
9. Every meaningful action gives visual feedback.
10. Discreet micro-interactions; no animation for its own sake.

---

## Design

Modern, premium, automotive, minimal, dark-first, clean. Light mode supported.

- No admin-dashboard look
- Cards, badges, charts, timeline, icons
- No horizontal overflow at any width
- Forms and modals must work correctly on small screens

Supported widths: 320px, 375px, 390px, 430px, 768px, 1024px, 1440px+.

---

## Data access

- All reads and writes go through `supabase-js`
- Authorization is **never** implemented in the client. The UI hides what a user shouldn't see; RLS is what actually prevents access.
- IDs are never trusted from the URL as proof of ownership — the query returns nothing if the row isn't the user's
- Derived metrics (km/L, cost per km, monthly totals) come from database views, not recomputed in the client

---

## Deploy

Connected to Vercel; pushes to `main` deploy to production.

```bash
npm run build   # must pass before pushing
```

Vercel environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Before merging:

- [ ] `npm run typecheck` and `npm run lint` clean
- [ ] Checked at 320px and at 1440px
- [ ] Empty, loading, and error states exist
- [ ] Dark and light mode both verified

---

## Roadmap

One phase at a time: review the current architecture, check what already exists, implement only that phase's scope, test, fix, then move on. No building ahead of the roadmap.

| Phase | Frontend |
|---|---|
| 1 — Foundation | Vite + Tailwind + shadcn setup, Supabase client, auth flows, app shell, theme, PWA, responsiveness |
| 2 — Garage | Vehicle list, add/edit/delete, main photo, vehicle selection |
| 3 — Core | Expenses, categories, unified timeline |
| 4 — Fuel | Fill-up logging, fuel economy and cost metrics |
| 5 — Maintenance | History, preventive plan, due/overdue states, in-app alerts |
| 6 — Projects | Projects, items, budget, progress |
| 7 — Files | Documents, attachments, photo gallery |
| 8 — Dashboard | Metrics, charts, cost per km, financial summary |
| 9 — Polish | UX, mobile, loading, empty states, errors, accessibility, performance |
| 10 — Private beta | Testing with a small group of friends |

---

## Out of scope for V1

AI and AI diagnostics, OCR, document or photo analysis, marketplace, shop integrations, community, social features, rankings, bank or gas-station integrations, WhatsApp, push notifications, native apps, insurer integrations, recommendations, predictive intelligence.

The architecture should leave room for these later — without carrying the complexity now.

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

Private. Personal use and closed beta.
