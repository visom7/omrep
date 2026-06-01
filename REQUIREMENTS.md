# Training Planner — Build Specification

> **For the orchestrator.** This document is the single source of truth for building an MVP.
> It is written to be decomposed into independent tasks and executed by subagents.
> Each module below has explicit **deliverables**, **acceptance criteria**, and **dependencies**.
> Read "Global Conventions" first — every subagent must honor it.

---

## 1. Product summary

A mobile-first web app for planning and tracking powerlifting training. A user organizes
training into **blocks → weeks → days → exercise entries → set groups**. The user plans
prescribed work, then logs what was actually performed in the gym. From the logged data the
app estimates 1RM over time, charts strength progress, and exports raw logs to CSV.

Primary device target: **phone**. Primary in-gym screen: a single day view.

---

## 2. Tech stack (pinned)

| Layer | Choice | Notes |
|---|---|---|
| Backend language | **Java 25 (LTS)** | Use records, sealed types, pattern matching, virtual threads. |
| Backend framework | **Spring Boot 4.0.x** | First-class Java 25 support; built on Spring Framework 7. Use latest 4.0 patch. |
| Persistence | **MongoDB** | `spring-boot-starter-data-mongodb`. No SQL, no Flyway. |
| Auth | **Spring Security + JWT** | Stateless access + refresh tokens; BCrypt password hashing. |
| Frontend | **React + Vite + TypeScript** | PWA (installable, offline-capable). |
| Server state | **TanStack Query** | |
| Routing | **React Router** | |
| Forms | **react-hook-form** | For nested set/rep/weight editing. |
| Charts | **Recharts** | |
| i18n | **react-i18next** | All UI copy in Spanish via locale files. |

> Build subagents must verify the exact current Spring Boot 4.0 patch and pin it in the build file.

---

## 3. Global conventions (NON-NEGOTIABLE)

1. **Code and data model are in English.** Every identifier — classes, fields, collections,
   API paths, JSON keys, variables, commit messages, code comments — is English.
2. **The app UI is in Spanish (castellano).** No hardcoded Spanish strings in components;
   all user-facing copy lives in `locales/es.json` and is referenced via i18n keys.
   The data layer never stores Spanish labels except user-authored content (e.g. a custom
   exercise name the user typed, or a block name).
3. **Per-user isolation.** Every query is scoped server-side to the authenticated `userId`
   taken from the JWT. The client-supplied id is never trusted for ownership.
4. **MVP styling = intentional restraint, not generic AI aesthetics.** See §9.
5. **Mobile-first.** Design every screen for a ~390px wide viewport first; desktop is secondary.
6. Validation on the application layer (Bean Validation on request DTOs). Documents map to records where practical.

---

## 4. Data model (English)

Four MongoDB collections. The **plan** is embedded (loaded/edited whole); the **log** is a flat,
indexed event store (one document per performed set) so progress queries and export stay cheap.

### 4.1 `users`
```
User {
  id: ObjectId
  email: string            // unique
  passwordHash: string     // BCrypt
  displayName: string
  preferredOneRmFormula: enum { EPLEY, BRZYCKI, LOMBARDI }  // default EPLEY
  createdAt: Instant
}
```

### 4.2 `exercises`  (catalog: global seeds + per-user custom)
```
Exercise {
  id: ObjectId
  ownerId: ObjectId | null   // null = global seed; otherwise user-owned custom
  name: string               // user-authored content may be Spanish
  movementPattern: enum { SQUAT, DEADLIFT, BENCH, PRESS, ROW, ACCESSORY, OTHER }
  isBasic: boolean           // counts toward the "total of basics" 1RM sum
}
```
Seed at least the user's tracked lifts as global exercises:
conventional deadlift, sumo deadlift, classic (high-bar) squat, low-bar squat — plus bench press.
Variants of the same pattern share `movementPattern` (e.g. both squats = SQUAT).

### 4.3 `blocks`  (the PLAN — nested, edited as a whole)
```
Block {
  id: ObjectId
  userId: ObjectId
  name: string               // user-authored, may be Spanish
  order: int
  createdAt: Instant
  weeks: Week[]
}
Week   { number: int; days: Day[] }
Day    { order: int; label: string; entries: ExerciseEntry[] }
ExerciseEntry {
  exerciseId: ObjectId
  exerciseName: string       // denormalized snapshot for display
  movementPattern: enum      // denormalized
  order: int
  setGroups: SetGroup[]
}
SetGroup {
  id: string                 // stable id within the block, used to link performed sets
  type: enum { WARMUP, WORKING }
  weightKg: number
  reps: int
  sets: int                  // "N sets of reps x weightKg"
  targetRpe: number | null
}
```

### 4.4 `workoutLogs`  (the REALITY — one document per performed set)
```
WorkoutLog {
  id: ObjectId
  userId: ObjectId
  date: Instant
  blockId: ObjectId | null
  setGroupId: string | null  // null = extra set done off-plan
  exerciseId: ObjectId
  exerciseName: string       // denormalized so history survives block edits/deletes
  movementPattern: enum      // denormalized
  isBasic: boolean           // denormalized
  setType: enum { WARMUP, WORKING }
  weightKg: number
  reps: int
  rpe: number | null
  completed: boolean
  estimatedOneRmKg: number   // computed at write time from the user's formula
}
```
**Indexes:** `{ userId: 1, exerciseId: 1, date: 1 }` and `{ userId: 1, date: 1 }`.

> A performed set may exist without a planned `setGroupId`; a planned set group may go unlogged.
> Do not enforce a 1:1 mapping.

---

## 5. 1RM estimation

Compute `estimatedOneRmKg` from `weightKg` and `reps` using the user's `preferredOneRmFormula`,
only for `WORKING` sets:

- **Epley** (default): `1RM = w * (1 + reps / 30)`
- **Brzycki**: `1RM = w * 36 / (37 - reps)`
- **Lombardi**: `1RM = w * reps^0.10`

Edge cases: `reps == 1` → `1RM = w`. Guard Brzycki against `reps >= 37`.
Implement as a pure, unit-tested utility on the backend; store the result on each log at write time.

---

## 6. Backend API surface (REST, all under `/api`, all JWT-protected except auth)

```
POST   /api/auth/register
POST   /api/auth/login            -> { accessToken, refreshToken }
POST   /api/auth/refresh

GET    /api/exercises             -> global seeds + caller's custom
POST   /api/exercises             -> create custom
DELETE /api/exercises/{id}        -> only own custom

GET    /api/blocks                -> list (metadata only)
POST   /api/blocks
GET    /api/blocks/{id}           -> full nested block
PUT    /api/blocks/{id}           -> replace nested block
DELETE /api/blocks/{id}
POST   /api/blocks/{id}/duplicate -> deep copy (+ optional progression: +kg / +reps)

POST   /api/logs                  -> log a performed set (server computes estimatedOneRmKg)
GET    /api/logs?from&to&blockId  -> filtered

GET    /api/progress/one-rm-total?from&to&bucket=week
        -> per bucket: best estimatedOneRmKg per basic movementPattern, summed
GET    /api/progress/volume?exerciseId&from&to&bucket=week
        -> per bucket: sum(weightKg * reps) for WORKING sets

GET    /api/export/logs.csv?from&to&blockId   -> streamed text/csv (see §7.7)
```

---

## 7. Feature modules (the tasks)

Each module is a self-contained unit a subagent can own. Order roughly follows dependency.

### M0 — Project scaffold & CI
**Deliverables:** Monorepo with `backend/` (Spring Boot 4.0 + Java 25, MongoDB starter, Security)
and `frontend/` (Vite + React + TS + PWA plugin). Dockerized local MongoDB. README with run steps.
**Acceptance:** `./gradlew bootRun` boots; `npm run dev` serves; frontend reaches a backend health endpoint.

### M1 — Auth & user management
**Deliverables:** register / login / refresh; BCrypt; JWT filter; `userId` resolved from token;
`preferredOneRmFormula` editable in a settings screen.
**Acceptance:** A user only ever sees their own blocks/logs. Tokens expire and refresh works.
Wrong-owner access returns 403/404. Unit tests on the auth flow.
**Depends on:** M0.

### M2 — Exercise catalog
**Deliverables:** seed global exercises (the four powerlifting variants + bench); list endpoint
merging seeds + custom; create/delete custom (own only). Frontend picker component.
**Acceptance:** Custom exercise of user A is invisible to user B. Seeds are read-only.
**Depends on:** M1.

### M3 — Block planning
**Deliverables:** full CRUD on nested blocks; the **duplicate-with-progression** endpoint;
mobile editor with drill-down navigation (block → week → day → entry → set groups), warmup vs
working set groups, react-hook-form for the nested editing.
**Acceptance:** A 3-week block with multiple days/exercises/set groups round-trips through
save/load unchanged. Duplicating a week and applying +2.5kg updates only working set weights.
Deep nesting is navigated screen-by-screen, never one giant form.
**Depends on:** M1, M2.

### M4 — Gym session view + logging  ⭐ most important screen
**Deliverables:** Block selector rendered as **tabs**. Within a block, the user **picks a day**;
that day view is the in-gym screen. Warmup groups collapsed by default; working sets shown as
tappable rows where the user confirms or edits weight/reps/RPE in one tap and marks completed.
Logging writes one `WorkoutLog` per performed set. Works offline (queue + sync on reconnect).
**Acceptance:** From a cold open in the gym, a user reaches today's working sets in ≤2 taps and
logs a set in 1 tap. Logging offline persists and syncs later. Each log carries the denormalized
`exerciseName`, `movementPattern`, `isBasic`, and computed `estimatedOneRmKg`.
**Depends on:** M1, M2, M3, M5.

### M5 — 1RM estimation utility
**Deliverables:** pure backend utility implementing Epley/Brzycki/Lombardi with edge-case guards;
applied at log write time per the user's formula.
**Acceptance:** Unit tests cover each formula, `reps==1`, and Brzycki's `reps>=37` guard.
**Depends on:** M1.

### M6 — Progress chart
**Deliverables:** Two MongoDB aggregations (total-of-basics 1RM, volume-per-exercise), both
**bucketed by week** (default). Recharts `LineChart` with a toggle between the two modes; in
volume mode an exercise selector. One metric on screen at a time on mobile.
**Total-of-basics logic:** per week, take the max `estimatedOneRmKg` per `movementPattern` among
`isBasic` exercises, then sum those maxima — so the two squat variants and two deadlift variants
never double-count a pattern.
**Acceptance:** With seeded logs, the total line equals (best SQUAT + best DEADLIFT + best BENCH)
per week. Volume mode shows `sum(weightKg*reps)` for the chosen exercise's working sets.
**Depends on:** M1, M4 (data), M5.

### M7 — CSV export
**Deliverables:** streamed `text/csv` endpoint, one row per performed set, columns:
`date, exerciseName, movementPattern, setType, weightKg, reps, rpe, completed, estimatedOneRmKg, blockId, day`.
Use **semicolon** delimiter and prepend a **UTF-8 BOM** (Excel in ES locale + accents).
`Content-Disposition: attachment`. Filter by date range / block. Frontend triggers download.
**Acceptance:** Opening the file in Excel (ES locale) shows correct columns and intact accents;
thousands of rows stream without loading all into memory (virtual threads).
**Depends on:** M1, M4.

### M8 — PWA shell & MVP styling
**Deliverables:** installable PWA (manifest, service worker, offline cache of the app shell);
i18n wired (`es.json`); global layout, navigation, and a minimal design-token layer (see §9).
**Acceptance:** Installs to a phone home screen; app shell loads offline; all visible copy comes
from `es.json`; restyling later touches only tokens, not component logic.
**Depends on:** M0; integrates all UI modules.

---

## 8. Suggested subagent decomposition

```
Wave 1 (parallel):   M0 scaffold
Wave 2 (parallel):   M1 auth   |  M5 one-rm util
Wave 3 (parallel):   M2 catalog  |  M8 PWA shell + i18n + tokens
Wave 4:              M3 block planning
Wave 5:              M4 gym session + logging   (needs M3 + M5)
Wave 6 (parallel):   M6 progress chart  |  M7 CSV export   (need logged data from M4)
```
Each subagent must run its own tests and must not violate §3. Integration agent wires waves
together and verifies cross-module acceptance (auth isolation across every endpoint).

---

## 9. Styling directive (MVP)

The MVP is **deliberately basic but not generic**. The goal is a clean, utilitarian, functional
interface — a tool, not a showcase — built so a later **Claude Design** revamp is a *reskin*, not
a refactor.

**Do:**
- Commit to a single restrained direction: **industrial / utilitarian** — high-contrast, dense
  where it helps (the gym day view), generous where it helps (forms), monospace or a single
  characterful sans for numbers (weights/reps read like a logbook).
- Centralize every visual decision in **design tokens** (CSS variables): colors, spacing, radii,
  type scale. Components reference tokens only. The revamp swaps tokens.
- Optimize the gym view for one-handed, glanceable use: big tap targets, weight/reps legible at arm's length.

**Do NOT:**
- Use generic AI aesthetics: purple/blue gradients on white, default Inter/Roboto/system stack as
  the deliberate choice, centered-everything hero layouts, decorative cards with no function.
- Over-invest in motion, illustration, or polish now — that is explicitly deferred to Claude Design.

---

## 10. Out of scope (MVP)

Social features, sharing, coach/athlete roles, advanced autoregulation/AI weight suggestions,
exercise media/video, push notifications, native apps, plate calculator. The polished visual
revamp (Claude Design) is a separate later phase.

---

## 11. Spanish UI copy (`locales/es.json` seed)

Subagents reference these keys; do not hardcode strings.
```
nav.blocks            = "Bloques"
nav.progress          = "Progreso"
nav.settings          = "Ajustes"
auth.login            = "Iniciar sesión"
auth.register         = "Crear cuenta"
auth.email            = "Correo"
auth.password         = "Contraseña"
block.new             = "Nuevo bloque"
block.duplicate       = "Duplicar"
week.label            = "Semana"
day.label             = "Día"
set.warmup            = "Calentamiento"
set.working           = "Serie efectiva"
set.weight            = "Peso (kg)"
set.reps              = "Repeticiones"
set.rpe               = "RPE"
set.completed         = "Completada"
session.today         = "Sesión de hoy"
session.logSet        = "Registrar serie"
progress.totalBasics  = "Total de básicos (1RM)"
progress.volume       = "Volumen por ejercicio"
progress.weekly       = "Semanal"
export.csv            = "Exportar CSV"
settings.formula      = "Fórmula de 1RM"
```
```
