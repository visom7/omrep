// ──────────────────────────────────────────────────────────────────────────
// TOTAL — shared UI components
// ──────────────────────────────────────────────────────────────────────────
const { useState, useRef, useEffect } = React;

// ---- Logo / wordmark ---------------------------------------------------------
function Mark({ size = 26 }) {
  // abstract loaded barbell end — two plates
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="9" width="5" height="14" rx="1.5" fill="var(--accent)" />
      <rect x="10" y="5" width="6" height="22" rx="2" fill="var(--accent)" />
      <rect x="19" y="14.5" width="10" height="3" rx="1.5" fill="var(--text-mute)" />
    </svg>
  );
}
function Wordmark({ small }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Mark size={small ? 22 : 28} />
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.14em',
        fontSize: small ? 17 : 22, color: 'var(--text)' }}>TOTAL</span>
    </div>
  );
}

// ---- Phone shell -------------------------------------------------------------
function PhoneShell({ children, rootStyle }) {
  return (
    <div className="device" style={rootStyle}>
      <div className="device__screen">
        <StatusBar />
        {children}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="statusbar">
      <span className="statusbar__time">9:41</span>
      <div className="statusbar__right">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="var(--text)"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="4.5" width="3" height="6.5" rx="1"/><rect x="9" y="2" width="3" height="9" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="var(--text)" opacity="0.5"/><rect x="2" y="2" width="13" height="7" rx="1.2" fill="var(--text)"/><rect x="19.5" y="3.5" width="1.5" height="4" rx="0.7" fill="var(--text)" opacity="0.5"/></svg>
      </div>
    </div>
  );
}

// ---- Bottom navigation -------------------------------------------------------
function BottomNav({ tab, onTab }) {
  const items = [
    { id: 'session', icon: 'session', label: 'Sesión' },
    { id: 'blocks', icon: 'blocks', label: 'Bloques' },
    { id: 'progress', icon: 'progress', label: 'Progreso' },
    { id: 'settings', icon: 'settings', label: 'Ajustes' },
  ];
  return (
    <nav className="bottomnav">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button key={it.id} className={'navitem' + (active ? ' navitem--on' : '')} onClick={() => onTab(it.id)}>
            <Icon name={it.icon} size={23} sw={active ? 2.1 : 1.8} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---- Plate stripe motif ------------------------------------------------------
function PlateBar({ kg }) {
  // build a small stack of calibrated-plate ticks summing toward kg (per side, /2 of bar≈20)
  const perSide = Math.max(0, (kg - 20) / 2);
  const sizes = [25, 20, 15, 10, 5, 2.5];
  const stack = [];
  let rem = perSide;
  for (const s of sizes) { while (rem >= s - 0.01) { stack.push(s); rem = Math.round((rem - s) * 10) / 10; if (stack.length > 6) break; } }
  if (stack.length === 0) stack.push(2.5);
  return (
    <div className="platebar" aria-hidden="true">
      {stack.map((s, i) => (<span key={i} className="platebar__t" style={{ background: PLATE[s] || '#888', height: 9 + (s / 25) * 11 }} />))}
    </div>
  );
}

// ---- Segmented control -------------------------------------------------------
function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button key={o.value} className={'segmented__b' + (value === o.value ? ' segmented__b--on' : '')}
          onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

// ---- SVG progress chart ------------------------------------------------------
function LineChart({ data, yKey, unit, height = 188 }) {
  const ref = useRef(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((es) => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const padL = 30, padR = 8, padT = 14, padB = 22;
  const vals = data.map((d) => d[yKey]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const lo = min - (max - min) * 0.18 - 1, hi = max + (max - min) * 0.12 + 1;
  const x = (i) => padL + (i / (data.length - 1)) * (w - padL - padR);
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (height - padT - padB);
  const pts = data.map((d, i) => [x(i), y(d[yKey])]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${x(data.length - 1).toFixed(1)} ${height - padB} L${padL} ${height - padB} Z`;
  const ticks = 3;
  const last = pts[pts.length - 1];
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const v = lo + (i / ticks) * (hi - lo);
          const yy = y(v);
          return (
            <g key={i}>
              <line x1={padL} y1={yy} x2={w - padR} y2={yy} stroke="var(--border)" strokeWidth="1" />
              <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-num)" fill="var(--text-mute)">{Math.round(v)}</text>
            </g>
          );
        })}
        <path d={area} fill="url(#fill)" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2} fill={i === pts.length - 1 ? 'var(--accent)' : 'var(--bg)'} stroke="var(--accent)" strokeWidth="1.6" />
        ))}
        {data.map((d, i) => (i % 2 === 0 || i === data.length - 1) ? (
          <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="9" fontFamily="var(--font-num)" fill="var(--text-mute)">{d.week}</text>
        ) : null)}
        <text x={last[0]} y={last[1] - 10} textAnchor="end" fontSize="11" fontFamily="var(--font-num)" fontWeight="700" fill="var(--accent)">{vals[vals.length - 1]}{unit}</text>
      </svg>
    </div>
  );
}

Object.assign(window, { Mark, Wordmark, PhoneShell, StatusBar, BottomNav, PlateBar, Segmented, LineChart });
