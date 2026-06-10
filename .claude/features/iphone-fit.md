# Feature: iphone-fit — Ajuste correcto del frontend en pantallas de iPhone

## Objetivo

Que todas las pantallas del frontend (Sesión, Bloques, Editor de bloques, Progreso, Login/Registro, Ajustes) se vean y funcionen correctamente en anchos de iPhone **375px–430px** (iPhone SE/mini → Pro Max), sin overflow horizontal ni elementos cortados, manteniendo intacto el diseño actual en pantallas ≥441px (contenedor centrado de `--max-content-width: 440px` con borde y sombra).

## Contexto técnico

- Frontend: React 19 + Vite + TypeScript, en `frontend/`.
- Estilos: CSS Modules + design tokens (CSS variables) en `frontend/src/styles/tokens.css`. Reglas globales en `frontend/src/styles/global.css`.
- El diseño ya es mobile-first; los safe-area insets (`env(safe-area-inset-*)`) ya se usan en TopBar, BottomNav, BottomSheet y AppLayout — **no tocar esos usos**.
- Único breakpoint existente: `@media (min-width: 441px)` en `frontend/src/layouts/AppLayout.module.css` (sombra desktop) — **no romperlo**.
- También correcto y a conservar: `min-height: 100dvh`, `overflow-x: hidden` en body, tabs de bloques con scroll horizontal intencional (`SessionPage.module.css` `.tabs`), BottomNav de 4 columnas.

## Cambios requeridos

1. **`frontend/index.html`** — el meta viewport actual es `width=device-width, initial-scale=1.0`. Añadir `viewport-fit=cover` para que `env(safe-area-inset-*)` funcione en iPhones con notch/Dynamic Island, especialmente en modo PWA standalone:
   `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />`

2. **`frontend/src/styles/tokens.css`** — añadir un bloque de breakpoint compacto para pantallas estrechas que redefina tokens (preferible a tocar cada módulo CSS):
   ```css
   @media (max-width: 389px) {
     :root {
       --pad: 14px;
       --text-hero: 3rem;     /* 48px, era 58px */
       --text-2xl: 1.625rem;  /* 26px, era 30px */
     }
   }
   ```

3. **`frontend/src/pages/session/SessionPage.module.css`** — el form de log (`.logFormGrid`, 3 columnas Peso/Reps/RPE con steppers) queda al límite en 375px: cada stepper necesita ~104px (2 botones de 30px + `.stepperValue` con `min-width: 40px` + padding 4px×2 + bordes) y un peso como "142.5" desborda. Hacerlo robusto:
   - Bajo `@media (max-width: 389px)`: reducir `gap` del grid (9px → 6px), padding de `.stepperCtl` (4px → 2px) y/o ancho de botones (30px → 26px).
   - Permitir que `.stepperValue` se encoja sin desbordar (p. ej. `min-width: 0` en el contexto adecuado o font-size menor en el breakpoint), verificando visualmente con el valor "142.5".

4. **`frontend/src/pages/ProgressPage.tsx`** — el `<LineChart>`/`<AreaChart>` de Recharts usa `margin={{ top: 8, right: 8, left: -16, bottom: 8 }}`; el `left: -16` puede cortar las etiquetas del eje Y en pantallas estrechas. Ajustar para que el eje Y sea siempre legible en 375px (p. ej. `left: 0` o configurar `width` del YAxis), sin desperdiciar espacio en 430px.

5. **Overflow por texto largo en tarjetas flex** — añadir `min-width: 0` a los hijos flexibles y truncado (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`) o `overflow-wrap: break-word` según corresponda en:
   - `frontend/src/pages/session/SessionPage.module.css`: `.dayCardName`, `.setRowEx` (nombres de ejercicio largos).
   - `frontend/src/pages/blocks/BlocksListPage.module.css`: `.blockCardName` (nombres de bloque largos).

## Criterios de aceptación

- Sin scroll horizontal ni elementos cortados en anchos 375px, 390px y 430px en todas las páginas: Sesión (incluido el form de log abierto con peso 142.5), lista de Bloques, Editor, Progreso (chart con eje Y visible), Login, Registro y Ajustes.
- En ≥441px el contenedor sigue centrado a 440px con borde y sombra, sin cambios visuales.
- `npm run test`, `npm run lint` y `npm run build` pasan en `frontend/`.
- Cambios solo en frontend; no tocar backend ni docker.
