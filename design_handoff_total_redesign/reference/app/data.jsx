// ──────────────────────────────────────────────────────────────────────────
// TOTAL — seed data, icons, helpers
// English data model (per REQUIREMENTS §3) · Spanish UI copy
// ──────────────────────────────────────────────────────────────────────────

// ---- 1RM (Epley, default) ----
function oneRm(weightKg, reps) {
  if (reps <= 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30));
}

// ---- pick legible text color over an accent ----
function onColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lin = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return L > 0.45 ? '#0b0c0e' : '#f6f7f8';
}

// IPF calibrated plate colours — used as a quiet motif on weights
const PLATE = { 25: '#e23b3b', 20: '#2f6fed', 15: '#f2c037', 10: '#2faa55', 5: '#e7e7e7', 2.5: '#9aa0a8' };

// ---- the training block (PLAN) ----
// movementPattern: SQUAT | BENCH | DEADLIFT | PRESS | ROW | ACCESSORY
const sg = (id, type, weightKg, reps, sets, targetRpe = null) =>
  ({ id, type, weightKg, reps, sets, targetRpe });

function buildWeek(n, factor) {
  // factor scales working weights across the block's waves
  const w = (kg) => Math.round(kg * factor);
  return {
    number: n,
    days: [
      {
        order: (n - 1) * 3 + 1, label: 'Día A · Sentadilla', focus: 'SQUAT',
        entries: [
          {
            exerciseName: 'Sentadilla baja', movementPattern: 'SQUAT', isBasic: true,
            setGroups: [
              sg(`s${n}1w1`, 'WARMUP', 60, 5, 1),
              sg(`s${n}1w2`, 'WARMUP', 100, 3, 1),
              sg(`s${n}1w3`, 'WARMUP', 130, 2, 1),
              sg(`s${n}1a`, 'WORKING', w(165), 3, 4, 8),
            ],
          },
          {
            exerciseName: 'Sentadilla con pausa', movementPattern: 'SQUAT', isBasic: false,
            setGroups: [ sg(`s${n}1b`, 'WORKING', w(140), 4, 3, 7) ],
          },
          {
            exerciseName: 'Prensa 45°', movementPattern: 'ACCESSORY', isBasic: false,
            setGroups: [ sg(`s${n}1c`, 'WORKING', 220, 10, 3) ],
          },
        ],
      },
      {
        order: (n - 1) * 3 + 2, label: 'Día B · Banca', focus: 'BENCH',
        entries: [
          {
            exerciseName: 'Press banca', movementPattern: 'BENCH', isBasic: true,
            setGroups: [
              sg(`s${n}2w1`, 'WARMUP', 40, 6, 1),
              sg(`s${n}2w2`, 'WARMUP', 70, 4, 1),
              sg(`s${n}2w3`, 'WARMUP', 90, 2, 1),
              sg(`s${n}2a`, 'WORKING', w(110), 4, 4, 8),
            ],
          },
          {
            exerciseName: 'Banca agarre cerrado', movementPattern: 'BENCH', isBasic: false,
            setGroups: [ sg(`s${n}2b`, 'WORKING', w(90), 6, 3, 7) ],
          },
          {
            exerciseName: 'Remo con barra', movementPattern: 'ROW', isBasic: false,
            setGroups: [ sg(`s${n}2c`, 'WORKING', 80, 8, 4) ],
          },
        ],
      },
      {
        order: (n - 1) * 3 + 3, label: 'Día C · Peso muerto', focus: 'DEADLIFT',
        entries: [
          {
            exerciseName: 'Peso muerto convencional', movementPattern: 'DEADLIFT', isBasic: true,
            setGroups: [
              sg(`s${n}3w1`, 'WARMUP', 80, 5, 1),
              sg(`s${n}3w2`, 'WARMUP', 130, 3, 1),
              sg(`s${n}3w3`, 'WARMUP', 170, 2, 1),
              sg(`s${n}3a`, 'WORKING', w(200), 2, 4, 8.5),
            ],
          },
          {
            exerciseName: 'Peso muerto sumo', movementPattern: 'DEADLIFT', isBasic: false,
            setGroups: [ sg(`s${n}3b`, 'WORKING', w(175), 3, 3, 7) ],
          },
          {
            exerciseName: 'Dominadas lastradas', movementPattern: 'ACCESSORY', isBasic: false,
            setGroups: [ sg(`s${n}3c`, 'WORKING', 20, 6, 4) ],
          },
        ],
      },
    ],
  };
}

const BLOCK = {
  id: 'b1',
  name: 'Bloque Fuerza · Marzo',
  order: 1,
  weeks: [ buildWeek(1, 1.0), buildWeek(2, 1.03), buildWeek(3, 1.06), buildWeek(4, 0.85) ],
};

const BLOCKS_LIST = [
  { id: 'b1', name: 'Bloque Fuerza · Marzo', weekCount: 4, days: 12, current: true },
  { id: 'b0', name: 'Hipertrofia · Feb', weekCount: 5, days: 15, current: false },
  { id: 'b-1', name: 'Peaking Open IPF', weekCount: 3, days: 9, current: false },
];

// ---- progress: total-of-basics 1RM by week ----
const PROGRESS_TOTAL = [
  { week: 'S1', total: 472 }, { week: 'S2', total: 478 }, { week: 'S3', total: 485 },
  { week: 'S4', total: 480 }, { week: 'S5', total: 492 }, { week: 'S6', total: 498 },
  { week: 'S7', total: 505 }, { week: 'S8', total: 512 }, { week: 'S9', total: 508 },
  { week: 'S10', total: 520 }, { week: 'S11', total: 528 }, { week: 'S12', total: 535 },
];
const BEST = { SQUAT: 205, BENCH: 130, DEADLIFT: 245 }; // current bests → total 580 target

const VOLUME = {
  'Sentadilla baja': [ { week: 'S7', v: 9.9 }, { week: 'S8', v: 10.8 }, { week: 'S9', v: 8.6 }, { week: 'S10', v: 11.4 }, { week: 'S11', v: 12.1 }, { week: 'S12', v: 9.2 } ],
  'Press banca': [ { week: 'S7', v: 6.6 }, { week: 'S8', v: 7.0 }, { week: 'S9', v: 5.4 }, { week: 'S10', v: 7.4 }, { week: 'S11', v: 7.8 }, { week: 'S12', v: 6.0 } ],
};

const EXERCISES = [
  { id: 'e1', name: 'Sentadilla baja', pattern: 'SQUAT', isBasic: true, seed: true },
  { id: 'e2', name: 'Sentadilla clásica', pattern: 'SQUAT', isBasic: true, seed: true },
  { id: 'e3', name: 'Press banca', pattern: 'BENCH', isBasic: true, seed: true },
  { id: 'e4', name: 'Peso muerto convencional', pattern: 'DEADLIFT', isBasic: true, seed: true },
  { id: 'e5', name: 'Peso muerto sumo', pattern: 'DEADLIFT', isBasic: true, seed: true },
  { id: 'e6', name: 'Sentadilla con pausa', pattern: 'SQUAT', isBasic: false, seed: false },
];

// ---- minimal line icons (simple geometry only) ----
function Icon({ name, size = 24, stroke = 'currentColor', sw = 1.8 }) {
  const p = { fill: 'none', stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const common = { width: size, height: size, viewBox: '0 0 24 24' };
  switch (name) {
    case 'blocks': return (
      <svg {...common}><rect x="4" y="4" width="16" height="5" rx="1.5" {...p} /><rect x="4" y="11.5" width="16" height="5" rx="1.5" {...p} /><line x1="4" y1="19.5" x2="20" y2="19.5" {...p} /></svg>
    );
    case 'session': return ( // barbell
      <svg {...common}><line x1="3" y1="12" x2="21" y2="12" {...p} /><rect x="5" y="8.5" width="2.4" height="7" rx="0.8" {...p} /><rect x="7.8" y="6.5" width="2.4" height="11" rx="0.8" {...p} /><rect x="13.8" y="6.5" width="2.4" height="11" rx="0.8" {...p} /><rect x="16.6" y="8.5" width="2.4" height="7" rx="0.8" {...p} /></svg>
    );
    case 'progress': return (
      <svg {...common}><polyline points="3,17 9,11 13,14 21,5" {...p} /><polyline points="16,5 21,5 21,10" {...p} /></svg>
    );
    case 'settings': return (
      <svg {...common}><line x1="4" y1="8" x2="20" y2="8" {...p} /><line x1="4" y1="16" x2="20" y2="16" {...p} /><circle cx="9" cy="8" r="2.4" fill="var(--bg)" {...p} /><circle cx="15" cy="16" r="2.4" fill="var(--bg)" {...p} /></svg>
    );
    case 'chevron': return (<svg {...common}><polyline points="9,5 16,12 9,19" {...p} /></svg>);
    case 'back': return (<svg {...common}><polyline points="15,5 8,12 15,19" {...p} /></svg>);
    case 'check': return (<svg {...common}><polyline points="5,12 10,17 19,7" {...p} strokeWidth={sw + 0.4} /></svg>);
    case 'plus': return (<svg {...common}><line x1="12" y1="5" x2="12" y2="19" {...p} /><line x1="5" y1="12" x2="19" y2="12" {...p} /></svg>);
    case 'flame': return (<svg {...common}><path d="M12 3c1 3-2 4-2 7a4 4 0 0 0 8 0c0-1-.5-2-1-2.5.2 2-1.5 2.5-1.5 1 0-2.5-2-4-3.5-5.5Z" {...p} /></svg>);
    case 'download': return (<svg {...common}><line x1="12" y1="4" x2="12" y2="15" {...p} /><polyline points="7,11 12,16 17,11" {...p} /><line x1="5" y1="20" x2="19" y2="20" {...p} /></svg>);
    case 'dup': return (<svg {...common}><rect x="8" y="8" width="11" height="11" rx="2" {...p} /><path d="M5 16V6a2 2 0 0 1 2-2h9" {...p} /></svg>);
    case 'logout': return (<svg {...common}><path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" {...p} /><polyline points="9,8 5,12 9,16" {...p} /><line x1="5" y1="12" x2="15" y2="12" {...p} /></svg>);
    default: return null;
  }
}

Object.assign(window, { oneRm, onColor, PLATE, BLOCK, BLOCKS_LIST, PROGRESS_TOTAL, BEST, VOLUME, EXERCISES, Icon });
