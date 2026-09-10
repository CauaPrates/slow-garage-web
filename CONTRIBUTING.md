# Contributing

This project has a small number of rules that are not style preferences — breaking
them produces bugs that stay hidden for weeks, because the wrong number still looks
plausible. Read this before the first pull request.

The rules live in two places, deliberately:

- **In prose, here.** This is the binding version, and it applies no matter what
  editor or assistant you use.
- **In `.claude/skills/`, as four project skills.** Claude Code loads them
  automatically when you open this repository, so an assistant follows the same
  rules without being told each time. They are the executable form of this
  document, not a separate set of rules.

If the two ever disagree, this file wins and the skill is the bug.

| Skill | Enforces |
|---|---|
| `sdd` | The spec → plan → tasks → implement → verify cycle, and the ban on inventing requirements |
| `slow-garage-data` | The data-layer contract: query keys, invalidation, Storage paths, error translation |
| `ui-verify` | UI is verified by running it, never by reading the JSX |
| `design-review` | Tokens, the four screen states, touch targets, semantics, language |

Two other skills exist on the author's machine (`frontend-design`, `ai`) and are
deliberately **not** versioned: they are general tooling, not rules of this project.

---

## Language

**Code in English, interface in Portuguese.** Both directions are a defect:
a `"Save"` label leaking to the screen, and a `function CartaoVeiculo` in the
source.

`docs/` and `specs/` are written in Portuguese — they are the engineering record,
and they were written in the language the decisions were made in. This file and the
README are in English because they are the front door of a public repository.

---

## The cycle

Any non-trivial work goes through `specs/NNN-slug/`: `spec.md`, `plan.md`,
`tasks.md`, `verification.md`. The templates are in
`.claude/skills/sdd/references/`.

Three things carry the weight:

1. **You may not invent a requirement.** If a necessary detail is not in the
   request, the repository, or an existing document, it does not exist. Ask.
   Never fill the gap with the industry default or with what "makes sense".
   This applies hardest to business rules, error behaviour, who can see what,
   what happens to existing data, and what counts as done.

2. **Acceptance criteria are numbered and observable.** `AC-3: the form
   validates correctly` is not a criterion. `AC-3: given a fill-up with no
   odometer reading, when the user saves, the system refuses the record,
   indicates the missing field, and persists nothing` is.

3. **Never write that something works without pasting the output that proves
   it.** `verification.md` holds literal command output, per AC. "Implemented as
   specified" is an opinion, not evidence. A build that fails is reported as
   failing — an invented green is discovered the first time someone uses the app.

Small changes may skip the files, but not the thinking: state the goal in one
sentence and the acceptance criteria as bullets, in the conversation or the PR
description, before writing code.

Decisions that outlive a phase go in `docs/DECISIONS.md` as a new ADR — including
the alternative you rejected and why. An ADR that only shows the chosen path hides
the decision.

---

## Data layer

The backend is a frozen Supabase project. `docs/API_CONTRACT.md` is the source of
truth — read it before writing a new hook. You do not change schema, policy, view,
function, or bucket from this repository. If data is missing, stop and report it;
the fix belongs to the backend repo.

**Three prohibitions:**

1. **Never recompute a value the database already computes.** `price_per_liter`,
   `km_per_liter`, `cost_per_km`, maintenance status, project progress, financing
   balance, totals — all arrive ready from a view or RPC. Summing in the client
   creates a second source of truth that will drift, and nobody will know which one
   is right. If you are writing `reduce((acc, x) => acc + x.amount, 0)` over server
   data, stop and look for the view.

2. **Fill-ups are not duplicated expenses.** `fuel_logs` is deliberately not
   mirrored into `expenses`. Never add the two collections in the client to get a
   vehicle total — use the financial summary view. Adding both double-counts fuel;
   using only `expenses` hides it.

3. **Storage follows the exact path** `{user_id}/{vehicle_id}/{uuid}.{ext}`. The
   policies read `user_id` from the first segment and validate `vehicle_id` in the
   second. A wrong path is rejected by RLS with no useful message. Buckets are
   private: read through `createSignedUrl`, never `getPublicUrl`.

Other rules that matter:

- Query keys are hierarchical (`['vehicles', vehicleId, 'expenses', filters]`) and
  all live in one object — never inline in a `useQuery`. Filters belong in the key.
- Invalidate what changed **and what derives from it**. Registering an expense
  affects the list, the timeline, the dashboard, and the monthly and per-category
  aggregates.
- **RLS denies by returning an empty list, not an error.** A query that returns
  zero rows where there should be data is an RLS or `vehicle_id` problem before it
  is a UI bug.
- Postgres errors never reach the screen raw. Translate by code (`23505`, `23503`,
  `23514`, `42501`, `PGRST116`) into Portuguese.
- `src/types/database.types.ts` is generated by `npm run types` and never edited by
  hand. If a type looks wrong, the schema changed — regenerate.
- Only the `anon` key belongs in this repository. If a feature seems to need
  `service_role`, the design is wrong.

---

## Interface

**A screen is verified by running it.** Reading the JSX and concluding it works is
deduction, not verification — code that compiles, types, and lints can still render
a screen that is cut off, unreadable, or overflowing at 320px.

Run `npm run ui:check` (Playwright + axe-core) and **look at the screenshots**.
Viewports are 320, 390, 768, and 1440px. Horizontal overflow is a hard failure. So
is any `serious` or `critical` axe violation. If you cannot run it, say so and list
what needs checking by hand — never fill the gap with an optimistic guess.

Verify on **both** phone and desktop widths, every time, even when the change
sounds desktop-only.

The script does not catch: the virtual keyboard covering the save button, flows
with real data, the four states forced one by one, keyboard navigation, or how the
interaction feels. Those are yours.

**Every screen that fetches has four states** — loading, empty, error, success.
Three is the classic bug, and the missing one is always empty, which is what a user
sees on day one. An empty state is a message *plus* an action; "Nenhum gasto
registrado" alone is a dead end.

**Design rules** (full rationale in `docs/DESIGN.md`):

- No hardcoded colour, radius, shadow, or spacing in a component. Everything comes
  from the tokens in `src/styles/tokens.css`. An arbitrary Tailwind class
  (`w-[347px]`, `bg-[#1a1a1a]`) is the most common leak.
- A `div` with `onClick` is a defect. If it clicks it is a `<button>`; if it
  navigates it is a `<Link>`.
- Every input has a real associated `<label>`. A placeholder is not a label.
- Minimum touch target 44×44px, especially for delete, edit, and close.
- No interface transition over 200ms; `transition-all` is a defect on its own.
- Money, dates, numbers, and mileage always go through `lib/format.ts`.

---

## Git

- One branch per phase: `feature/<slug>` for features, `docs/<slug>` for
  documentation-only work.
- Merge into `dev` with `git merge --no-ff`. Branches are not deleted — they are
  the record of what was done in one pass.
- `main` is production and protected: no direct pushes, no force-pushes, no
  deletion, and a merge requires the `Lint + build` check to be green.
- Pushing to `dev` builds a Vercel preview; merging to `main` builds production.

Commit messages:

```
feat(expenses): add quick-entry sheet
fix(mobile): prevent horizontal overflow on vehicle card
chore(deps): bump vite
refactor(timeline): extract event row component
```

---

## Definition of done

- [ ] `npm run build` (which runs `tsc -b`) and `npm run lint` are clean
- [ ] Checked at 320px and 1440px, in both themes
- [ ] Loading, empty, error, and success states exist, in Portuguese
- [ ] No horizontal overflow, no `serious`/`critical` axe violation
- [ ] Every acceptance criterion has literal evidence, not a claim
- [ ] Any decision worth keeping is an ADR in `docs/DECISIONS.md`
