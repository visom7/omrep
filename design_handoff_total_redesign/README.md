# Handoff: TOTAL — visual redesign (Training Planner)

## Overview
This is the **Claude Design revamp** that `REQUIREMENTS.md §9` deferred — the reskin of the
powerlifting Training Planner PWA. It gives the app a brand identity (**TOTAL** — named after
the powerlifting *total*: squat + bench + deadlift) and a finished visual system across every
screen, while staying inside the existing architecture: **the data model and API are untouched**,
all visual decisions remain in **CSS tokens**, and all copy stays in **i18n** (`es.json`).

> The repo was deliberately built so this phase is a **reskin, not a refactor**. ~70% of the
> restyle lands just by swapping `tokens.css`. The rest is the new components below.

## About the design files
The files in `reference/` are a **design reference built in HTML/React (Babel-in-browser)** —
a prototype showing the intended look, layout, and interactions. **Do not ship them as-is.**
The task is to **recreate this design in the existing frontend** (React + Vite + TS + CSS Modules
+ react-i18next + TanStack Query), reusing its established patterns. The HTML is the spec; your
repo is the home.

`reference/TOTAL.html` loads, in order: `tweaks-panel.jsx` (prototype-only, ignore for prod),
`app/data.jsx` (seed data + 1RM helper + icons), `app/components.jsx` (shared UI), `app/screens.jsx`
(Login/Session/Blocks/Progress/Settings), `app/sheets.jsx` (bottom sheets), `app/editor.jsx`
(register + block editor), `app/app.jsx` (root + navigation + theming).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and interactions. Recreate
pixel-faithfully using the values in `styles/` and the specs below. The class names in
`styles/total-components.css` match the reference JSX 1:1, so a component and its styles can be
lifted together.

---

## How to apply to THIS repo (fastest path)

1. **Fonts** — add Archivo + Space Mono. Either keep the `@import` already in
   `styles/global.css`, or self-host with `@fontsource` (recommended for offline PWA — see the
   note at the top of `global.css`).
2. **Tokens** — replace `frontend/src/styles/tokens.css` with `styles/tokens.css`.
   ⚠️ Token names changed/were added (`--color-on-accent`, `--color-border-strong`, `--font-num`,
   `--pat-*`, `--plate-*`, `--radius-*`, `--pad`, `--gap`, `--row`, `--text-hero`). A few old names
   were renamed — grep components for `--color-border-focus` → `--color-border-strong` and
   `--color-text-on-accent` → `--color-on-accent`.
3. **Global** — merge `styles/global.css` (adds `.num`, `.label`, reduced-motion, font import).
4. **Components** — `styles/total-components.css` is grouped by target module
   (`SessionPage.module.css`, `BlocksListPage.module.css`, `ProgressPage.module.css`,
   `SettingsPage.module.css`, plus new `BottomNav`, `Sheet`, and editor styles). Either split each
   section into the matching `*.module.css` and reference via `styles.x`, or import the file once
   globally and use the class names verbatim.
5. **i18n** — merge `locales/es.additions.json` into `src/locales/es.json` (new keys only).
6. **Theme toggle** — set `document.documentElement.dataset.theme = 'light' | 'dark'` from a new
   Ajustes control; dark is the default. Persist to the user record or `localStorage`.
7. **New components to add** (see specs): `<PlateBar kg>`, `<BottomSheet>`, the block-editor
   drill-down (`BlockEditorPage` already exists — extend it), `<ExercisePicker>` as a sheet,
   duplicate-with-progression sheet, CSV-export sheet, and a `RegisterPage` polish.

---

## Screens / Views

### 1 · Login  (`LoginPage`)
- **Purpose:** authenticate; brand moment.
- **Layout:** vertically centered column, 26px side padding. Brand block (mark + wordmark +
  tagline) → email field → password field → primary button → "Crear cuenta" link → footer line.
- **Components:**
  - **Mark** (logo): abstract loaded-barbell end — two accent plates + a muted bar stub. SVG, 28–46px.
  - **Wordmark** `TOTAL`: `--font-display`, weight 800, `letter-spacing: .12em`, 46px.
  - **Tagline** `PLANIFICA · LEVANTA · SUMA`: `--font-num`, 11px, `letter-spacing: .22em`, muted.
  - **Fields** (`.field` + `.input`): label is uppercase mono 11px; input 15px, 13×18px padding,
    1px border, focus → accent border.
  - **Primary button** (`.btn .btnAccent`, full width, 16px padding): lime, dark text.

### 2 · Register  (`RegisterPage`)
Same skeleton as Login with three fields (display name / email / password) and a "Registrarse"
button. Heading 34px. Toggle back to Login via the "Iniciar sesión" link.

### 3 · Session — list  ⭐ in-gym screen  (`SessionPage`)
- **Purpose:** reach today's working sets in ≤2 taps.
- **Layout:** header (`session.today` kicker + date H1 + streak chip on the right) → block tabs
  (horizontal scroll) → per-week groups, each a labeled rule + day cards.
- **Components:**
  - **Block tabs** (`.tab` / `.tabActive`): pill 9×15px; active = accent border + 12% accent wash.
  - **Streak chip:** flame icon + count, accent, pill outline.
  - **Week head** (`.weekHead`): `SEMANA N` mono uppercase + flexible rule + `N días`.
  - **Day card** (`.dayCard`): left border tinted by movement pattern (`data-pat`); shows pattern
    tag (colored), day name (display 17px), meta (`N ejercicios · N series efectivas`), chevron.
    Today's card → accent border + `box-shadow: 0 0 0 1px accent` + `HOY` badge.

### 4 · Session — day view  (`SessionPage` day state)
- **Purpose:** confirm/log each working set in 1 tap; warmups out of the way.
- **Layout:** back button → header (`SEMANA N · PATTERN` kicker colored by pattern + day H1) →
  completion bar → collapsible warmup → `SERIES EFECTIVAS` label → set rows → 1RM strip.
- **Components:**
  - **Completion bar** (`.progressBar`): 30px; accent-wash fill with a 2px accent leading edge;
    label `done/total series`.
  - **Warmup toggle** (`.warmToggle`): dashed border, flame icon, count, chevron; expands to rows.
  - **Set row** (`.setRow`, min-height `--row` = 66px): circular check (fills accent when done) +
    exercise name (display 15px, accent dot if `isBasic`) + meta (`N series · objetivo RPE x`) +
    right stack: reps (mono, muted) over **weight (mono, 23px, accent)** + **PlateBar**. Tap → inline
    **log form**: three steppers (Peso ±2.5 / Reps ±1 / RPE ±0.5) + live `≈ 1RM` + Cancelar / Registrar.
    Done rows drop to 58% opacity.
  - **1RM strip** (`.oneRmStrip`): diagonal hairline-striped surface; `1RM est. del día` + max value.

### 5 · Blocks  (`BlocksListPage`)
- **Layout:** header (`Tus planes` kicker + `Bloques` H1 + accent `+` icon button) → block cards.
- **Block card** (`.blockCard`): 4px left status bar (accent if active) + body: name (wraps,
  line-height 1.25) + `ACTIVO` badge + stats (`N semanas` / `N días`, big mono numbers) +
  chip row (Duplicar / Editar). Active card → accent border.

### 6 · Block editor — drill-down  (`BlockEditorPage`, extend)
- **Overview overlay** (`.overlay`): bar (back + `Guardar` pill) → big block-name input → per-week
  sections (week head + day cards by pattern + dashed `Añadir día`) → `Añadir semana`.
- **Day editor:** bar (back + `Semana N` crumb) → day-name input → entry cards → `Añadir ejercicio`.
  - **Entry card** (`.entryCard`): name with pattern-tinted left border + remove `✕`; set-group rows
    (`.sgRow`): type **pill** (`CAL` muted / `EFE` accent) + `sets × reps @ weight` (mono) + `RPE`.
    Tap a row → inline **SetGroupForm**: 4 steppers (Series/Reps/Peso/RPE) + type toggle
    (Calentamiento↔Efectiva) + Eliminar / Hecho. `+ Calentamiento` / `+ Serie efectiva` add groups.

### 7 · Exercise picker  (sheet)
Bottom sheet: search input → `Nuevo ejercicio personalizado` add button → list of `.pickItem`
(name + pattern label colored by `data-pat`, `· personalizado` suffix for custom, basic dot).
Create form: name field + 3-col pattern grid (`data-pat` tinted) + "Ejercicio básico" switch.

### 8 · Progress  (`ProgressPage`)
- **Total card** (`.totalCard`): corner accent-radial; `TOTAL DE BÁSICOS · 1RM` label, **hero number
  58px**, delta line (accent), 3-up split (SENT / BANCA / MUERTO with pattern-colored labels +
  mono numbers).
- **Segmented** (`.segmented`): Total 1RM / Volumen. Volume mode reveals exercise chips.
- **Chart card** (`.chartCard`): Recharts `LineChart`. Stroke + dots + area-gradient + last-point
  label all use `--color-accent`; grid + axis ticks use `--color-border` / `--color-text-muted`;
  tick `fontFamily: var(--font-num)`. Caption below.
- **Export** ghost button → CSV sheet.

### 9 · CSV export  (sheet)
Range segmented (4 / 8 / 12 sem / Todo) + block scope chips (Bloque activo / Todos) + `Filas a
exportar ≈ N` stat + format note (`;` + BOM UTF-8) + `Descargar .csv`. Wire to the existing
`GET /api/export/logs.csv?from&to&blockId`.

### 10 · Duplicate with progression  (sheet)
Three radio options (Copia exacta / +2.5 kg en efectivas / +1 repetición) + Duplicar → success
state (accent check ring + confirmation). Wire to `POST /api/blocks/{id}/duplicate`.

### 11 · Settings  (`SettingsPage`)
Profile row (accent square avatar with initial + name/email) → `FÓRMULA DE 1RM` radio list
(Epley/Brzycki/Lombardi, each with its formula in mono) → display-name field → theme toggle →
`Cerrar sesión` ghost button.

---

## Interactions & Behavior
- **Navigation:** bottom nav (Sesión / Bloques / Progreso / Ajustes); active item = accent color +
  3px top indicator bar. Session list→day is in-page state, not a route, in the prototype; in the
  repo keep your routes.
- **Log a set:** tap set row → inline form (no modal) → Registrar marks done (check fills, row dims).
  Keep the existing offline queue (`enqueueOfflineLog` / `flushOfflineQueue`).
- **Sheets:** mount → toggle `--on` class next frame → slide up `.26s var(--ease-sheet)`; backdrop
  fades; tap backdrop/handle/✕ to close (animate out ~220ms before unmount).
- **Editor overlay:** full-screen, `.28s` slide-up; back navigates one drill-down level.
- **Steppers:** Peso ±2.5kg, Reps ±1 (min 1), RPE ±0.5 (clamp 5–10).
- **Transitions:** fast 120ms (color/border), base 200ms; cards `:active { scale(.99) }`.
- **Reduced motion:** honored globally (see `global.css`).

## State Management
No new server state. UI state: `authView (login|register)`, `tab`, `selectedBlockId`,
`selectedDayOrder`, `loggedSets`, `editingSetGroupId`, editor draft (deep clone of the block, saved
via `PUT /api/blocks/{id}`), open-sheet descriptor, and `theme (dark|light)`. Keep TanStack Query
for blocks/logs/progress exactly as-is.

## Design Tokens
Full set in `styles/tokens.css`. Headlines:
- **Accent** `#c6f829` (lime); on-accent `#0b0c0e`. Alts for theming: `#ff5d2e` `#4d8dff` `#19c37d` `#f5f0e6`.
- **Dark surfaces:** bg `#0c0d0f` · surface `#151619` · raised `#1d1f24` · border `#26282e` · border-strong `#34373f` · text `#f4f5f6` · muted `#888d96`.
- **Light surfaces:** bg `#f3f1ec` · surface `#fff` · raised `#ebe8e1` · border `#dcd8cf` · border-strong `#ccc6ba` · text `#16171a` · muted `#73767d`.
- **Pattern hints:** SQUAT `#ff6a4d` · BENCH `#5b8cff` · DEADLIFT `#1fc985` · PRESS `#d9a441`.
- **IPF plates (PlateBar):** 25 `#e23b3b` · 20 `#2f6fed` · 15 `#f2c037` · 10 `#2faa55` · 5 `#e7e7e7` · 2.5 `#9aa0a8`.
- **Type:** display/body **Archivo** (400/600/700/800); numbers **Space Mono** (400/700), tabular.
  Scale: 11 / 13 / 15 / 17 / 21 / 30 / 58(hero).
- **Spacing:** pad 18 · gap 9 · set-row 66; xs4 sm8 md16 lg24 xl32. Density variants in tokens.
- **Radii:** sm 6 · md 12 · lg 18 (industrial/hard variant ≈ ×0.35).

## Assets
No raster assets. The **Mark** logo and all nav/UI icons are inline SVGs from simple geometry
(see `Icon` + `Mark` in `reference/app/data.jsx` / `components.jsx`) — reuse or replace with your
icon system. PWA icons (`public/pwa-*.svg`) should be regenerated from the Mark.

## Files
```
design_handoff_total_redesign/
├── README.md                      ← this file
├── styles/
│   ├── tokens.css                 ← drop-in for src/styles/tokens.css
│   ├── global.css                 ← drop-in for src/styles/global.css (fonts + base)
│   └── total-components.css       ← all component CSS, grouped by target module
├── locales/
│   └── es.additions.json          ← new i18n keys to merge into src/locales/es.json
└── reference/                     ← the HTML/React design prototype (reference only)
    ├── TOTAL.html
    ├── tweaks-panel.jsx           ← prototype tweak panel; NOT for production
    └── app/{data,components,screens,sheets,editor,app}.jsx
```

## Notes
- Keep §3 conventions: **English code/data, Spanish UI via i18n, per-user isolation.** None of the
  redesign changes the data model, endpoints, or 1RM logic.
- The prototype's phone frame, status bar, and Tweaks panel are **scaffolding** — the real PWA uses
  the device chrome. Ignore `.device` / `.statusbar` / `tweaks-panel.jsx`.
- `data-pat="SQUAT|BENCH|DEADLIFT|PRESS"` on any element exposes `var(--pat)` for categorical color.
