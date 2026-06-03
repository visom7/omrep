// ──────────────────────────────────────────────────────────────────────────
// TOTAL — screens
// ──────────────────────────────────────────────────────────────────────────
const { useState: useS } = React;

// ════════════════════════════════════════════════════════════════ LOGIN ════
function LoginScreen({ onEnter, onRegister }) {
  return (
    <div className="screen screen--auth">
      <div className="auth__brand">
        <Mark size={46} />
        <h1 className="auth__word">TOTAL</h1>
        <p className="auth__tag">PLANIFICA · LEVANTA · SUMA</p>
      </div>
      <div className="auth__form">
        <label className="field">
          <span className="field__l">Correo</span>
          <input className="field__i" defaultValue="victor@total.app" />
        </label>
        <label className="field">
          <span className="field__l">Contraseña</span>
          <input className="field__i" type="password" defaultValue="••••••••" />
        </label>
        <button className="btn btn--accent btn--lg" onClick={onEnter}>Entrar</button>
        <p className="auth__alt">¿No tienes cuenta? <b onClick={onRegister} style={{ cursor: 'pointer' }}>Crear cuenta</b></p>
      </div>
      <p className="auth__foot">Bloques · Sesiones · 1RM · Volumen</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════ SESSION ════
function SessionScreen({ density }) {
  const [blockId, setBlockId] = useS('b1');
  const [dayOrder, setDayOrder] = useS(null);
  const block = BLOCK;

  const allDays = block.weeks.flatMap((w) => w.days.map((d) => ({ ...d, weekNumber: w.number })));
  const day = allDays.find((d) => d.order === dayOrder) || null;

  if (day) return <DayView day={day} onBack={() => setDayOrder(null)} />;

  return (
    <div className="screen">
      <header className="phead">
        <div>
          <p className="phead__kick">Sesión de hoy</p>
          <h1 className="phead__h1">Miércoles 3</h1>
        </div>
        <div className="streak"><Icon name="flame" size={16} /><span>12</span></div>
      </header>

      <div className="tabs">
        {BLOCKS_LIST.map((b) => (
          <button key={b.id} className={'tab' + (b.id === blockId ? ' tab--on' : '')} onClick={() => setBlockId(b.id)}>
            {b.name.split(' · ')[0]}
          </button>
        ))}
      </div>

      {block.weeks.map((week) => (
        <section key={week.number} className="weekgrp">
          <div className="weekgrp__h">
            <span>Semana {week.number}</span>
            <span className="weekgrp__line" />
            <span className="weekgrp__n">{week.days.length} días</span>
          </div>
          {week.days.map((d) => {
            const working = d.entries.reduce((a, e) => a + e.setGroups.filter((s) => s.type === 'WORKING').length, 0);
            const top = d.entries[0].setGroups.filter((s) => s.type === 'WORKING')[0];
            const isToday = week.number === 1 && d.order === 1;
            return (
              <button key={d.order} className={'daycard' + (isToday ? ' daycard--today' : '')} onClick={() => setDayOrder(d.order)}>
                <div className="daycard__l">
                  <span className="daycard__tag" data-pat={d.focus}>{d.focus}</span>
                  <span className="daycard__name">{d.label.split(' · ')[1]}</span>
                  <span className="daycard__meta">{d.entries.length} ejercicios · {working} series efectivas</span>
                </div>
                <div className="daycard__r">
                  {isToday && <span className="daycard__hoy">HOY</span>}
                  <Icon name="chevron" size={20} stroke="var(--text-mute)" />
                </div>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function DayView({ day, onBack }) {
  const [warmOpen, setWarmOpen] = useS(false);
  const [logged, setLogged] = useS({});
  const [editing, setEditing] = useS(null);

  const working = day.entries.flatMap((e) => e.setGroups.filter((s) => s.type === 'WORKING').map((s) => ({ ...s, ex: e.exerciseName, basic: e.isBasic, pat: e.movementPattern })));
  const warmup = day.entries.flatMap((e) => e.setGroups.filter((s) => s.type === 'WARMUP').map((s) => ({ ...s, ex: e.exerciseName })));
  const doneCount = Object.keys(logged).length;

  return (
    <div className="screen">
      <button className="backbtn" onClick={onBack}><Icon name="back" size={18} /> Sesión</button>
      <header className="phead phead--day">
        <div>
          <p className="phead__kick" data-pat={day.focus}>Semana {day.weekNumber} · {day.focus}</p>
          <h1 className="phead__h1">{day.label.split(' · ')[1]}</h1>
        </div>
      </header>

      <div className="progressbar">
        <div className="progressbar__fill" style={{ width: (doneCount / working.length * 100) + '%' }} />
        <span className="progressbar__lbl">{doneCount}/{working.length} series</span>
      </div>

      {warmup.length > 0 && (
        <section className="warm">
          <button className="warm__toggle" onClick={() => setWarmOpen((v) => !v)}>
            <span><Icon name="flame" size={15} /> Calentamiento · {warmup.length}</span>
            <Icon name="chevron" size={16} stroke="var(--text-mute)" />
          </button>
          {warmOpen && (
            <div className="warm__list">
              {warmup.map((s) => (
                <div key={s.id} className="warm__row">
                  <span>{s.ex}</span>
                  <span className="num">{s.sets}×{s.reps} · {s.weightKg}<i>kg</i></span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <p className="seclabel">Series efectivas</p>
      <section className="sets">
        {working.map((s) => {
          const done = logged[s.id];
          if (editing === s.id) return <LogForm key={s.id} s={s} onCancel={() => setEditing(null)} onSave={(d) => { setLogged((p) => ({ ...p, [s.id]: d })); setEditing(null); }} />;
          return (
            <button key={s.id} className={'setrow' + (done ? ' setrow--done' : '')} onClick={() => !done && setEditing(s.id)}>
              <span className={'setrow__check' + (done ? ' setrow__check--on' : '')}>{done && <Icon name="check" size={16} stroke="var(--on-accent)" />}</span>
              <div className="setrow__info">
                <span className="setrow__ex">{s.ex} {s.basic && <em className="basicdot" title="Básico" />}</span>
                <span className="setrow__meta">{s.sets} series · objetivo {s.targetRpe ? 'RPE ' + s.targetRpe : '—'}</span>
              </div>
              <div className="setrow__load">
                <span className="setrow__rep num">{done ? done.reps : s.reps}<i>rep</i></span>
                <span className="setrow__kg num">{done ? done.weight : s.weightKg}<i>kg</i></span>
                <PlateBar kg={done ? done.weight : s.weightKg} />
              </div>
            </button>
          );
        })}
      </section>

      <div className="oneRmStrip">
        <span>1RM est. del día</span>
        <b className="num">{Math.max(...working.filter((s) => s.basic).map((s) => oneRm(s.weightKg, s.reps)))}<i>kg</i></b>
      </div>
    </div>
  );
}

function LogForm({ s, onSave, onCancel }) {
  const [weight, setWeight] = useS(s.weightKg);
  const [reps, setReps] = useS(s.reps);
  const [rpe, setRpe] = useS(s.targetRpe || 8);
  const step = (set, val, d, min = 0) => set(Math.max(min, Math.round((val + d) * 10) / 10));
  return (
    <div className="logform">
      <div className="logform__head"><span className="setrow__ex">{s.ex}</span><span className="num est">≈ {oneRm(weight, reps)}kg 1RM</span></div>
      <div className="logform__grid">
        <Stepper label="Peso" unit="kg" value={weight} onMinus={() => step(setWeight, weight, -2.5)} onPlus={() => step(setWeight, weight, 2.5)} />
        <Stepper label="Reps" unit="" value={reps} onMinus={() => step(setReps, reps, -1, 1)} onPlus={() => step(setReps, reps, 1)} />
        <Stepper label="RPE" unit="" value={rpe} onMinus={() => step(setRpe, rpe, -0.5, 5)} onPlus={() => step(setRpe, rpe, 0.5)} />
      </div>
      <div className="logform__act">
        <button className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn--accent" onClick={() => onSave({ weight, reps, rpe })}><Icon name="check" size={17} stroke="var(--on-accent)" /> Registrar</button>
      </div>
    </div>
  );
}
function Stepper({ label, unit, value, onMinus, onPlus }) {
  return (
    <div className="stepper">
      <span className="stepper__l">{label}</span>
      <div className="stepper__ctl">
        <button onClick={onMinus}>−</button>
        <span className="num">{value}{unit && <i>{unit}</i>}</span>
        <button onClick={onPlus}>+</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════ BLOCKS ════
function BlocksScreen({ onEdit, onNew, onDuplicate }) {
  const blockFor = (b) => b.id === 'b1' ? BLOCK : {
    id: b.id, name: b.name,
    weeks: Array.from({ length: b.weekCount }, (_, i) => ({ number: i + 1,
      days: Array.from({ length: 3 }, (_, d) => ({ order: (i + 1) * 10 + d + 1, label: 'Día ' + (d + 1), focus: null, entries: [] })) })),
  };
  return (
    <div className="screen">
      <header className="phead">
        <div><p className="phead__kick">Tus planes</p><h1 className="phead__h1">Bloques</h1></div>
        <button className="iconbtn iconbtn--accent" onClick={onNew}><Icon name="plus" size={20} stroke="var(--on-accent)" /></button>
      </header>
      <div className="blocklist">
        {BLOCKS_LIST.map((b) => (
          <div key={b.id} className={'blockcard' + (b.current ? ' blockcard--on' : '')}>
            <div className="blockcard__bar" />
            <div className="blockcard__body">
              <div className="blockcard__top">
                <span className="blockcard__name">{b.name}</span>
                {b.current && <span className="badge">ACTIVO</span>}
              </div>
              <div className="blockcard__stats">
                <span><b className="num">{b.weekCount}</b> semanas</span>
                <span><b className="num">{b.days}</b> días</span>
              </div>
              <div className="blockcard__act">
                <button className="chip" onClick={() => onDuplicate(b)}><Icon name="dup" size={14} /> Duplicar</button>
                <button className="chip" onClick={() => onEdit(blockFor(b))}>Editar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════ PROGRESS ════
function ProgressScreen({ onExport }) {
  const [mode, setMode] = useS('oneRm');
  const [ex, setEx] = useS('Sentadilla baja');
  const total = BEST.SQUAT + BEST.BENCH + BEST.DEADLIFT;
  const delta = PROGRESS_TOTAL[PROGRESS_TOTAL.length - 1].total - PROGRESS_TOTAL[0].total;
  return (
    <div className="screen">
      <header className="phead"><div><p className="phead__kick">12 semanas</p><h1 className="phead__h1">Progreso</h1></div></header>

      <div className="totalcard">
        <span className="totalcard__l">TOTAL DE BÁSICOS · 1RM</span>
        <div className="totalcard__big"><span className="num">{total}</span><i>kg</i></div>
        <div className="totalcard__delta num">▲ {delta}kg en el bloque</div>
        <div className="totalcard__split">
          <div><span data-pat="SQUAT">SENT</span><b className="num">{BEST.SQUAT}</b></div>
          <div><span data-pat="BENCH">BANCA</span><b className="num">{BEST.BENCH}</b></div>
          <div><span data-pat="DEADLIFT">MUERTO</span><b className="num">{BEST.DEADLIFT}</b></div>
        </div>
      </div>

      <Segmented value={mode} onChange={setMode} options={[{ value: 'oneRm', label: 'Total 1RM' }, { value: 'volume', label: 'Volumen' }]} />

      {mode === 'volume' && (
        <div className="exchips">
          {Object.keys(VOLUME).map((k) => (
            <button key={k} className={'chip' + (ex === k ? ' chip--on' : '')} onClick={() => setEx(k)}>{k}</button>
          ))}
        </div>
      )}

      <div className="chartcard">
        {mode === 'oneRm'
          ? <LineChart data={PROGRESS_TOTAL} yKey="total" unit="kg" />
          : <LineChart data={VOLUME[ex]} yKey="v" unit="t" />}
        <p className="chartcard__cap">{mode === 'oneRm' ? 'Suma de los mejores 1RM por patrón, por semana' : 'Tonelaje semanal · ' + ex}</p>
      </div>

      <button className="btn btn--ghost btn--full" onClick={onExport}><Icon name="download" size={17} /> Exportar CSV</button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════ SETTINGS ════
function SettingsScreen({ onLogout }) {
  const [formula, setFormula] = useS('EPLEY');
  const formulas = [{ id: 'EPLEY', l: 'Epley', d: 'w · (1 + reps/30)' }, { id: 'BRZYCKI', l: 'Brzycki', d: 'w · 36/(37−reps)' }, { id: 'LOMBARDI', l: 'Lombardi', d: 'w · reps^0.10' }];
  return (
    <div className="screen">
      <header className="phead"><div><p className="phead__kick">Tu cuenta</p><h1 className="phead__h1">Ajustes</h1></div></header>

      <div className="profile">
        <div className="profile__av">V</div>
        <div><b>Víctor Soto</b><span>victor@total.app</span></div>
      </div>

      <p className="seclabel">Fórmula de 1RM</p>
      <div className="formulas">
        {formulas.map((f) => (
          <button key={f.id} className={'formula' + (formula === f.id ? ' formula--on' : '')} onClick={() => setFormula(f.id)}>
            <span className={'radio' + (formula === f.id ? ' radio--on' : '')} />
            <div><b>{f.l}</b><span className="num">{f.d}</span></div>
          </button>
        ))}
      </div>

      <label className="field field--row">
        <span className="field__l">Nombre para mostrar</span>
        <input className="field__i" defaultValue="Víctor Soto" />
      </label>

      <button className="btn btn--ghost btn--full" style={{ marginTop: 'auto' }} onClick={onLogout}><Icon name="logout" size={17} /> Cerrar sesión</button>
    </div>
  );
}

Object.assign(window, { LoginScreen, SessionScreen, BlocksScreen, ProgressScreen, SettingsScreen });
