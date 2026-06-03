// ──────────────────────────────────────────────────────────────────────────
// TOTAL — bottom sheets: Exercise picker · Duplicate · Export CSV
// ──────────────────────────────────────────────────────────────────────────
const { useState: useSt, useEffect: useEf } = React;

// ---- Sheet primitive ---------------------------------------------------------
function Sheet({ title, onClose, children, footer }) {
  const [show, setShow] = useSt(false);
  useEf(() => { const r = requestAnimationFrame(() => setShow(true)); return () => cancelAnimationFrame(r); }, []);
  const close = () => { setShow(false); setTimeout(onClose, 220); };
  return (
    <div className={'sheetwrap' + (show ? ' sheetwrap--on' : '')}>
      <div className="sheet-backdrop" onClick={close} />
      <div className="sheet">
        <div className="sheet__handle" onClick={close} />
        <div className="sheet__head">
          <h3 className="sheet__title">{title}</h3>
          <button className="sheet__close" onClick={close}>✕</button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---- Exercise picker ---------------------------------------------------------
function ExercisePicker({ onPick, onClose }) {
  const [q, setQ] = useSt('');
  const [creating, setCreating] = useSt(false);
  const [name, setName] = useSt('');
  const [pattern, setPattern] = useSt('ACCESSORY');
  const [basic, setBasic] = useSt(false);
  const list = EXERCISES.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
  const patterns = ['SQUAT', 'BENCH', 'DEADLIFT', 'PRESS', 'ROW', 'ACCESSORY'];
  const label = { SQUAT: 'Sentadilla', BENCH: 'Banca', DEADLIFT: 'Peso muerto', PRESS: 'Press', ROW: 'Remo', ACCESSORY: 'Accesorio' };

  if (creating) return (
    <Sheet title="Nuevo ejercicio" onClose={onClose}
      footer={<button className="btn btn--accent" disabled={!name} onClick={() => onPick({ id: 'cx' + Date.now(), name, pattern, isBasic: basic })}>Crear y añadir</button>}>
      <label className="field"><span className="field__l">Nombre del ejercicio</span>
        <input className="field__i" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sentadilla frontal" /></label>
      <label className="field"><span className="field__l">Patrón de movimiento</span>
        <div className="patgrid">
          {patterns.map((p) => (
            <button key={p} className={'patbtn' + (pattern === p ? ' patbtn--on' : '')} data-pat={p} onClick={() => setPattern(p)}>{label[p]}</button>
          ))}
        </div>
      </label>
      <button className={'toggle-row' + (basic ? ' toggle-row--on' : '')} onClick={() => setBasic((v) => !v)}>
        <div><b>Ejercicio básico</b><span>Cuenta para el total de 1RM</span></div>
        <span className={'switch' + (basic ? ' switch--on' : '')} />
      </button>
      <button className="linkback" onClick={() => setCreating(false)}>← Volver al catálogo</button>
    </Sheet>
  );

  return (
    <Sheet title="Añadir ejercicio" onClose={onClose}>
      <input className="field__i search" placeholder="Buscar ejercicio…" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="addbtn" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> Nuevo ejercicio personalizado</button>
      <div className="picklist">
        {list.map((e) => (
          <button key={e.id} className="pickitem" onClick={() => onPick(e)}>
            <div className="pickitem__l">
              <span className="pickitem__name">{e.name} {e.isBasic && <em className="basicdot" />}</span>
              <span className="pickitem__pat" data-pat={e.pattern}>{label[e.pattern]}{!e.seed && ' · personalizado'}</span>
            </div>
            <Icon name="plus" size={18} stroke="var(--text-mute)" />
          </button>
        ))}
        {list.length === 0 && <p className="emptyhint">Sin resultados. Crea uno personalizado.</p>}
      </div>
    </Sheet>
  );
}

// ---- Duplicate with progression ----------------------------------------------
function DuplicateSheet({ block, onClose }) {
  const [prog, setProg] = useSt('kg');
  const [done, setDone] = useSt(false);
  const opts = [
    { id: 'none', t: 'Copia exacta', d: 'Mismos pesos y repeticiones' },
    { id: 'kg', t: '+2.5 kg', d: 'Solo en series efectivas' },
    { id: 'rep', t: '+1 repetición', d: 'En todas las series efectivas' },
  ];
  if (done) return (
    <Sheet title="Bloque duplicado" onClose={onClose}
      footer={<button className="btn btn--accent" onClick={onClose}>Listo</button>}>
      <div className="okstate">
        <span className="okstate__ring"><Icon name="check" size={30} stroke="var(--on-accent)" /></span>
        <b>«{block.name}» duplicado</b>
        <span>{prog === 'none' ? 'Copia exacta creada' : prog === 'kg' ? 'Con +2.5 kg en series efectivas' : 'Con +1 repetición por serie'}</span>
      </div>
    </Sheet>
  );
  return (
    <Sheet title="Duplicar bloque" onClose={onClose}
      footer={<button className="btn btn--accent" onClick={() => setDone(true)}><Icon name="dup" size={16} stroke="var(--on-accent)" /> Duplicar</button>}>
      <p className="sheet__sub">Crea una copia de <b>«{block.name}»</b> aplicando una progresión automática.</p>
      <div className="optlist">
        {opts.map((o) => (
          <button key={o.id} className={'optrow' + (prog === o.id ? ' optrow--on' : '')} onClick={() => setProg(o.id)}>
            <span className={'radio' + (prog === o.id ? ' radio--on' : '')} />
            <div><b>{o.t}</b><span>{o.d}</span></div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

// ---- CSV export --------------------------------------------------------------
function ExportSheet({ onClose }) {
  const [range, setRange] = useSt('12');
  const [scope, setScope] = useSt('all');
  const counts = { '4': 96, '8': 188, '12': 274, all: 612 };
  return (
    <Sheet title="Exportar CSV" onClose={onClose}
      footer={<button className="btn btn--accent" onClick={onClose}><Icon name="download" size={16} stroke="var(--on-accent)" /> Descargar .csv</button>}>
      <p className="seclabel">Rango</p>
      <Segmented value={range} onChange={setRange}
        options={[{ value: '4', label: '4 sem' }, { value: '8', label: '8 sem' }, { value: '12', label: '12 sem' }, { value: 'all', label: 'Todo' }]} />
      <p className="seclabel" style={{ marginTop: 16 }}>Bloque</p>
      <div className="exchips">
        <button className={'chip' + (scope === 'current' ? ' chip--on' : '')} onClick={() => setScope('current')}>Bloque activo</button>
        <button className={'chip' + (scope === 'all' ? ' chip--on' : '')} onClick={() => setScope('all')}>Todos</button>
      </div>
      <div className="exportstat">
        <span>Filas a exportar</span>
        <b className="num">≈ {counts[range]}</b>
      </div>
      <p className="emptyhint" style={{ textAlign: 'left', marginTop: 10 }}>Delimitador «;» + BOM UTF-8 · compatible con Excel (ES) y acentos.</p>
    </Sheet>
  );
}

Object.assign(window, { Sheet, ExercisePicker, DuplicateSheet, ExportSheet });
