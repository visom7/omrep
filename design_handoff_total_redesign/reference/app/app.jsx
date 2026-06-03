// ──────────────────────────────────────────────────────────────────────────
// TOTAL — app root + Tweaks
// ──────────────────────────────────────────────────────────────────────────
const { useState: useState_, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#c6f829",
  "dark": true,
  "density": "regular",
  "numFont": "mono",
  "corners": "soft"
}/*EDITMODE-END*/;

const DENS = {
  compact: { unit: 5, row: 58, pad: 16, gap: 7 },
  regular: { unit: 6, row: 66, pad: 18, gap: 9 },
  comfy:   { unit: 7, row: 74, pad: 22, gap: 11 },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [authed, setAuthed] = useState_(false);
  const [authView, setAuthView] = useState_('login');
  const [tab, setTab] = useState_('session');
  const [editor, setEditor] = useState_(null);   // null | { source }
  const [sheet, setSheet] = useState_(null);      // null | { kind, block }

  const vars = useMemo(() => {
    const dark = t.dark;
    const d = DENS[t.density] || DENS.regular;
    const r = t.corners === 'hard' ? 0.35 : 1;
    const numFont = t.numFont === 'mono'
      ? "'Space Mono', ui-monospace, monospace"
      : "'Archivo', system-ui, sans-serif";
    return {
      '--accent': t.accent,
      '--on-accent': onColor(t.accent),
      '--bg': dark ? '#0c0d0f' : '#f3f1ec',
      '--surface': dark ? '#151619' : '#ffffff',
      '--raised': dark ? '#1d1f24' : '#ebe8e1',
      '--border': dark ? '#26282e' : '#dcd8cf',
      '--border-2': dark ? '#34373f' : '#ccc6ba',
      '--text': dark ? '#f4f5f6' : '#16171a',
      '--text-mute': dark ? '#888d96' : '#73767d',
      '--font-display': "'Archivo', system-ui, sans-serif",
      '--font-body': "'Archivo', system-ui, sans-serif",
      '--font-num': numFont,
      '--u': d.unit + 'px',
      '--row': d.row + 'px',
      '--pad': d.pad + 'px',
      '--gap': d.gap + 'px',
      '--r-sm': (6 * r) + 'px',
      '--r-md': (12 * r) + 'px',
      '--r-lg': (18 * r) + 'px',
      colorScheme: dark ? 'dark' : 'light',
    };
  }, [t]);

  return (
    <div className="stage">
      <PhoneShell rootStyle={vars}>
        {!authed ? (
          authView === 'login'
            ? <LoginScreen onEnter={() => setAuthed(true)} onRegister={() => setAuthView('register')} />
            : <RegisterScreen onEnter={() => setAuthed(true)} onBack={() => setAuthView('login')} />
        ) : (
          <>
            <div className="appscroll">
              {tab === 'session' && <SessionScreen density={t.density} />}
              {tab === 'blocks' && <BlocksScreen onEdit={(src) => setEditor({ source: src })} onNew={() => setEditor({ source: null })} onDuplicate={(b) => setSheet({ kind: 'duplicate', block: b })} />}
              {tab === 'progress' && <ProgressScreen onExport={() => setSheet({ kind: 'export' })} />}
              {tab === 'settings' && <SettingsScreen onLogout={() => { setAuthed(false); setAuthView('login'); }} />}
            </div>
            <BottomNav tab={tab} onTab={setTab} />

            {editor && <BlockEditor source={editor.source} onClose={() => setEditor(null)} />}
            {sheet?.kind === 'duplicate' && <DuplicateSheet block={sheet.block} onClose={() => setSheet(null)} />}
            {sheet?.kind === 'export' && <ExportSheet onClose={() => setSheet(null)} />}
          </>
        )}
      </PhoneShell>

      <TweaksPanel>
        <TweakSection label="Identidad" />
        <TweakColor label="Acento" value={t.accent}
          options={['#c6f829', '#ff5d2e', '#4d8dff', '#19c37d', '#f5f0e6']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakToggle label="Modo oscuro" value={t.dark} onChange={(v) => setTweak('dark', v)} />
        <TweakSection label="Datos" />
        <TweakRadio label="Fuente de números" value={t.numFont}
          options={[{ value: 'mono', label: 'Mono' }, { value: 'sans', label: 'Sans' }]}
          onChange={(v) => setTweak('numFont', v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Densidad" value={t.density}
          options={[{ value: 'compact', label: 'Densa' }, { value: 'regular', label: 'Media' }, { value: 'comfy', label: 'Aireada' }]}
          onChange={(v) => setTweak('density', v)} />
        <TweakRadio label="Bordes" value={t.corners}
          options={[{ value: 'soft', label: 'Suaves' }, { value: 'hard', label: 'Duros' }]}
          onChange={(v) => setTweak('corners', v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
