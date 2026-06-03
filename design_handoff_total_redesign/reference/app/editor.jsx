// ──────────────────────────────────────────────────────────────────────────
// TOTAL — Register screen + Block editor (drill-down)
// ──────────────────────────────────────────────────────────────────────────
const { useState: useStE } = React;

// ═══════════════════════════════════════════════════════════ REGISTER ══════
function RegisterScreen({ onEnter, onBack }) {
  return (
    <div className="screen screen--auth">
      <div className="auth__brand auth__brand--sm">
        <Mark size={36} />
        <h1 className="auth__word" style={{ fontSize: 34 }}>CREAR CUENTA</h1>
        <p className="auth__tag">EMPIEZA TU PRIMER BLOQUE</p>
      </div>
      <div className="auth__form">
        <label className="field"><span className="field__l">Nombre para mostrar</span>
          <input className="field__i" placeholder="Víctor Soto" /></label>
        <label className="field"><span className="field__l">Correo</span>
          <input className="field__i" placeholder="tu@correo.com" /></label>
        <label className="field"><span className="field__l">Contraseña</span>
          <input className="field__i" type="password" placeholder="Mínimo 8 caracteres" /></label>
        <button className="btn btn--accent btn--lg" onClick={onEnter}>Registrarse</button>
        <p className="auth__alt">¿Ya tienes cuenta? <b onClick={onBack} style={{ cursor: 'pointer' }}>Iniciar sesión</b></p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════ BLOCK EDITOR ════
function blankBlock() {
  return { id: 'new', name: '', weeks: [{ number: 1, days: [{ order: 1, label: 'Día 1', focus: null, entries: [] }] }] };
}
function cloneBlock(b) { return JSON.parse(JSON.stringify(b)); }

function BlockEditor({ source, onClose }) {
  const [block, setBlock] = useStE(() => source ? cloneBlock(source) : blankBlock());
  const [dayKey, setDayKey] = useStE(null); // {w, d}

  const update = (fn) => setBlock((b) => { const c = cloneBlock(b); fn(c); return c; });

  const addWeek = () => update((b) => {
    const n = b.weeks.length + 1;
    b.weeks.push({ number: n, days: [{ order: n * 10 + 1, label: 'Día 1', focus: null, entries: [] }] });
  });
  const addDay = (wi) => update((b) => {
    const w = b.weeks[wi];
    w.days.push({ order: w.number * 10 + w.days.length + 1, label: 'Día ' + (w.days.length + 1), focus: null, entries: [] });
  });

  if (dayKey) {
    const week = block.weeks[dayKey.w];
    const day = week.days[dayKey.d];
    return <DayEditor day={day} weekNumber={week.number}
      onBack={() => setDayKey(null)}
      onChange={(fn) => update((b) => fn(b.weeks[dayKey.w].days[dayKey.d]))} />;
  }

  return (
    <div className="overlay">
      <div className="overlay__bar">
        <button className="backbtn" onClick={onClose}><Icon name="back" size={18} /> Bloques</button>
        <button className="btn btn--accent btn--pill" onClick={onClose}>Guardar</button>
      </div>
      <div className="overlay__scroll">
        <label className="field"><span className="field__l">Nombre del bloque</span>
          <input className="field__i field__i--big" autoFocus={!source} value={block.name}
            placeholder="Ej. Bloque Fuerza · Abril" onChange={(e) => update((b) => { b.name = e.target.value; })} /></label>

        {block.weeks.map((week, wi) => (
          <section key={wi} className="weekedit">
            <div className="weekgrp__h"><span>Semana {week.number}</span><span className="weekgrp__line" /><span className="weekgrp__n">{week.days.length} días</span></div>
            {week.days.map((day, di) => {
              const work = day.entries.reduce((a, e) => a + e.setGroups.filter((s) => s.type === 'WORKING').length, 0);
              return (
                <button key={di} className="daycard" data-pat={day.focus || undefined} onClick={() => setDayKey({ w: wi, d: di })}>
                  <div className="daycard__l">
                    <span className="daycard__name">{day.label.includes('·') ? day.label.split(' · ')[1] : day.label}</span>
                    <span className="daycard__meta">{day.entries.length} ejercicios · {work} efectivas</span>
                  </div>
                  <Icon name="chevron" size={20} stroke="var(--text-mute)" />
                </button>
              );
            })}
            <button className="addbtn" onClick={() => addDay(wi)}><Icon name="plus" size={15} /> Añadir día</button>
          </section>
        ))}
        <button className="addbtn addbtn--solid" onClick={addWeek}><Icon name="plus" size={15} /> Añadir semana</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────── DAY EDITOR ────────────────
function DayEditor({ day, weekNumber, onBack, onChange }) {
  const [picking, setPicking] = useStE(false);
  const [openSg, setOpenSg] = useStE(null); // `${ei}-${si}`

  const addEntry = (ex) => {
    onChange((d) => {
      d.entries.push({ exerciseName: ex.name, movementPattern: ex.pattern, isBasic: ex.isBasic,
        setGroups: [{ id: 'sg' + Date.now(), type: 'WORKING', weightKg: 100, reps: 5, sets: 3, targetRpe: 8 }] });
    });
    setPicking(false);
  };
  const removeEntry = (ei) => onChange((d) => { d.entries.splice(ei, 1); });
  const addSg = (ei, type) => onChange((d) => {
    d.entries[ei].setGroups.push({ id: 'sg' + Date.now(), type, weightKg: type === 'WARMUP' ? 60 : 100, reps: type === 'WARMUP' ? 5 : 5, sets: 1, targetRpe: type === 'WARMUP' ? null : 8 });
  });
  const editSg = (ei, si, fn) => onChange((d) => fn(d.entries[ei].setGroups[si]));
  const removeSg = (ei, si) => onChange((d) => { d.entries[ei].setGroups.splice(si, 1); });

  return (
    <div className="overlay">
      <div className="overlay__bar">
        <button className="backbtn" onClick={onBack}><Icon name="back" size={18} /> Bloque</button>
        <span className="overlay__crumb">Semana {weekNumber}</span>
      </div>
      <div className="overlay__scroll">
        <label className="field"><span className="field__l">Nombre del día</span>
          <input className="field__i field__i--big" value={day.label} onChange={(e) => onChange((d) => { d.label = e.target.value; })} /></label>

        {day.entries.length === 0 && <p className="emptyhint">Sin ejercicios. Añade el primero abajo.</p>}

        {day.entries.map((entry, ei) => (
          <div key={ei} className="entrycard">
            <div className="entrycard__h">
              <span className="entrycard__name" data-pat={entry.movementPattern}>{entry.exerciseName}{entry.isBasic && <em className="basicdot" />}</span>
              <button className="iconbtn iconbtn--sm" onClick={() => removeEntry(ei)} aria-label="Eliminar">✕</button>
            </div>
            <div className="sglist">
              {entry.setGroups.map((sg, si) => {
                const key = ei + '-' + si;
                if (openSg === key) return (
                  <SetGroupForm key={si} sg={sg} onClose={() => setOpenSg(null)}
                    onChange={(fn) => editSg(ei, si, fn)} onRemove={() => { removeSg(ei, si); setOpenSg(null); }} />
                );
                return (
                  <button key={si} className="sgrow" onClick={() => setOpenSg(key)}>
                    <span className={'pill ' + (sg.type === 'WARMUP' ? 'pill--warm' : 'pill--work')}>{sg.type === 'WARMUP' ? 'CAL' : 'EFE'}</span>
                    <span className="sgrow__txt num">{sg.sets} × {sg.reps} <i>@</i> {sg.weightKg}<i>kg</i></span>
                    {sg.targetRpe != null && <span className="sgrow__rpe num">RPE {sg.targetRpe}</span>}
                  </button>
                );
              })}
            </div>
            <div className="sgadd">
              <button className="chip" onClick={() => addSg(ei, 'WARMUP')}><Icon name="plus" size={13} /> Calentamiento</button>
              <button className="chip" onClick={() => addSg(ei, 'WORKING')}><Icon name="plus" size={13} /> Serie efectiva</button>
            </div>
          </div>
        ))}

        <button className="addbtn addbtn--solid" onClick={() => setPicking(true)}><Icon name="plus" size={15} /> Añadir ejercicio</button>
      </div>
      {picking && <ExercisePicker onPick={addEntry} onClose={() => setPicking(false)} />}
    </div>
  );
}

function SetGroupForm({ sg, onChange, onRemove, onClose }) {
  const step = (key, d, min = 0) => onChange((s) => { s[key] = Math.max(min, Math.round((s[key] + d) * 10) / 10); });
  return (
    <div className="logform logform--sg">
      <div className="logform__head">
        <div className="typetoggle">
          <button className={sg.type === 'WARMUP' ? 'on' : ''} onClick={() => onChange((s) => { s.type = 'WARMUP'; })}>Calentamiento</button>
          <button className={sg.type === 'WORKING' ? 'on' : ''} onClick={() => onChange((s) => { s.type = 'WORKING'; })}>Efectiva</button>
        </div>
      </div>
      <div className="logform__grid logform__grid--4">
        <MiniStep label="Series" value={sg.sets} onMinus={() => step('sets', -1, 1)} onPlus={() => step('sets', 1)} />
        <MiniStep label="Reps" value={sg.reps} onMinus={() => step('reps', -1, 1)} onPlus={() => step('reps', 1)} />
        <MiniStep label="Peso" unit="kg" value={sg.weightKg} onMinus={() => step('weightKg', -2.5)} onPlus={() => step('weightKg', 2.5)} />
        <MiniStep label="RPE" value={sg.targetRpe ?? '—'} onMinus={() => onChange((s) => { s.targetRpe = Math.max(5, (s.targetRpe || 8) - 0.5); })} onPlus={() => onChange((s) => { s.targetRpe = Math.min(10, (s.targetRpe || 7.5) + 0.5); })} />
      </div>
      <div className="logform__act">
        <button className="btn btn--ghost btn--danger" onClick={onRemove}>Eliminar</button>
        <button className="btn btn--accent" onClick={onClose}><Icon name="check" size={16} stroke="var(--on-accent)" /> Hecho</button>
      </div>
    </div>
  );
}
function MiniStep({ label, unit, value, onMinus, onPlus }) {
  return (
    <div className="stepper">
      <span className="stepper__l">{label}</span>
      <div className="stepper__ctl stepper__ctl--sm">
        <button onClick={onMinus}>−</button>
        <span className="num">{value}{unit && <i>{unit}</i>}</span>
        <button onClick={onPlus}>+</button>
      </div>
    </div>
  );
}

Object.assign(window, { RegisterScreen, BlockEditor });
