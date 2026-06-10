# Feature: block-editor-improvements — Editar bloques, configurar sets, gestionar ejercicios custom y duplicar semanas

## Objetivo

Cinco mejoras al planificador de bloques (módulo M3) que hoy faltan o están rotas:

1. **Editar un bloque existente** debe cargar sus datos (hoy abre el editor vacío como si fuera nuevo).
2. Al **crear/editar un día**, poder configurar **peso y repeticiones target** (y series y RPE) de cada set group; hoy se crean con valores fijos y se muestran en solo lectura.
3. Un **botón "guardar día"** en el overlay de edición de día.
4. Poder **eliminar y editar ejercicios personalizados** (custom) del usuario.
5. Poder **duplicar una semana dentro de un bloque** ajustando los pesos respecto a la semana anterior, en **kg absolutos (+/-)**.

## Contexto técnico

- Frontend: React 19 + Vite + TypeScript en `frontend/`. Estado de formularios con `react-hook-form`, data fetching con TanStack Query.
- Backend: Spring Boot 4 / Java / MongoDB en `backend/`. `userId` SIEMPRE se resuelve del JWT (`@AuthenticationPrincipal String userId`), nunca del body (§3.3 de REQUIREMENTS.md).
- Identificadores en inglés; **todo texto de UI vía i18n** en `frontend/src/locales/es.json` (NO strings en español hardcodeados en componentes) — §3.2 NO NEGOCIABLE.
- Modelo de datos de bloque (ver `frontend/src/api/blocks.ts` y `backend/.../block/`):
  `Block { id, userId, name, order, createdAt, weeks: Week[] }`,
  `Week { number, days: Day[] }`, `Day { order, label, entries: ExerciseEntry[] }`,
  `ExerciseEntry { exerciseId, exerciseName, movementPattern, order, setGroups: SetGroup[] }`,
  `SetGroup { id (UUID estable), type: WARMUP|WORKING, weightKg, reps, sets, targetRpe: number|null }`.
- Endpoints de bloque existentes: `GET /api/blocks`, `POST /api/blocks`, `GET /api/blocks/{id}`, `PUT /api/blocks/{id}` (reemplaza el bloque anidado completo), `DELETE /api/blocks/{id}`, `POST /api/blocks/{id}/duplicate`.
- Endpoints de ejercicio existentes (`backend/.../exercise/ExerciseController.java`): `GET /api/exercises`, `POST /api/exercises`, `DELETE /api/exercises/{id}`. **NO existe PUT** para editar.

## Cambios requeridos

### 1. Editar bloque existente (BUG)

Archivo: `frontend/src/pages/blocks/BlockEditorPage.tsx`.

- La página se monta tanto en `/blocks/new` como en `/blocks/:blockId/edit` (ver rutas en `frontend/src/App.tsx`). Cuando `blockId` existe (`isEditing`), el `useForm` se inicializa con `defaultValues: { name: '', weeks: [] }` y **nunca carga el bloque** → el editor aparece vacío como si fuera nuevo.
- Corregir: cuando hay `blockId`, hacer `useQuery` con `blocksApi.get(blockId)` y, al cargar, `reset()` el formulario con `{ name, weeks }` del bloque. Mostrar estado de carga mientras llega.
- Asegurar un punto de entrada visible a "editar bloque": añadir un botón/acción **Editar** que navegue a `/blocks/:blockId/edit` desde `frontend/src/pages/blocks/BlockDetailPage.tsx` y/o desde la tarjeta de bloque en `frontend/src/pages/blocks/BlocksListPage.tsx` (revisar dónde encaja mejor; hoy parece no existir el acceso). Verificar que tras "Guardar" en modo edición se invalida `['blocks']` y `['block', blockId]`.

### 2. Configurar peso / reps / series / RPE target por set group

Archivo: `frontend/src/pages/blocks/BlockEditorPage.tsx` (overlay de edición de día, `editingDay !== null`).

- Hoy `handleAddSetGroup` crea `{ weightKg: 60, reps: 5, sets: 1, targetRpe: null }` y cada set group se renderiza en **solo lectura** (`{sg.sets}×{sg.reps} @ {sg.weightKg}kg`).
- Hacer cada set group **editable**: inputs/steppers para `sets`, `reps`, `weightKg` y `targetRpe` (RPE opcional, puede quedar vacío → `null`). Actualizar el form con `setValue` en la ruta `weeks.${w}.days.${d}.entries.${e}.setGroups`.
- Permitir **eliminar** un set group y **eliminar** un exercise entry del día.
- `weightKg` admite decimales (p. ej. 142.5); `reps`/`sets` enteros ≥ 1; `targetRpe` entre 1 y 10 o vacío. Validar de forma ligera (no romper el guardado).
- Reutilizar el estilo de steppers existente del proyecto si aplica; mantener tap targets cómodos en móvil (≈375–430px) sin overflow horizontal.

### 3. Botón "guardar día"

Archivo: `frontend/src/pages/blocks/BlockEditorPage.tsx` (top bar del overlay de día).

- Añadir un botón **"Guardar día"** (clave i18n nueva, p. ej. `editor.saveDay`).
- Comportamiento: **solo confirma en memoria** — cierra el overlay (`setEditingDay(null)`) dejando los cambios en el estado del formulario. La persistencia real ocurre con el botón **"Guardar"** a nivel de bloque (que hace POST/PUT). No debe hacer llamada al backend por sí mismo.
- El botón "← Semana N" (volver) debe seguir existiendo y también conservar los cambios en memoria (mismo comportamiento que hoy, que ya usa `setValue`).

### 4. Eliminar / editar ejercicios personalizados

**Backend** (`backend/src/main/java/com/trainingplanner/exercise/`):
- Añadir `PUT /api/exercises/{id}` que actualiza `name`, `movementPattern`, `isBasic` de un ejercicio **propio** (ownerId == userId del JWT).
  - 404 si no existe; **403** si es seed global (`ownerId == null`) o de otro usuario (mismas reglas que `delete`, ver `ExerciseService.delete`).
  - Reutilizar/validar con un DTO (`UpdateExerciseRequest` o el `CreateExerciseRequest` existente): `name` no en blanco, `movementPattern` enum válido.
  - Devolver `ExerciseResponse` actualizado.
- `DELETE /api/exercises/{id}` ya existe; reutilizarlo.

**Frontend**:
- Crear un módulo API de ejercicios (p. ej. `frontend/src/api/exercises.ts`) con `list/create/update/delete`, o extender donde corresponda (hoy `ExercisePicker.tsx` llama `apiFetch` directo).
- En `frontend/src/components/ExercisePicker.tsx`: para los ejercicios marcados `isCustom`, ofrecer acciones **editar** y **eliminar** (los seeds globales NO se editan ni borran). Al editar, reutilizar el formulario de creación precargado. Al borrar, pedir confirmación e invalidar `['exercises']`.
- Considerar si conviene además una gestión de ejercicios desde Ajustes (`SettingsPage`), pero el requisito mínimo es poder editar/borrar custom desde el picker.
- Nuevas claves i18n (`exercise.edit`, `exercise.delete`, `exercise.editTitle`, confirmación de borrado, etc.).

### 5. Duplicar una semana ajustando pesos (kg absolutos)

Archivo principal: `frontend/src/pages/blocks/BlockEditorPage.tsx` (operación a nivel de semana). Es una operación **client-side sobre el estado del formulario** (no requiere endpoint nuevo): el bloque se persiste luego con "Guardar".

- En la cabecera de cada semana del editor, añadir acción **"Duplicar semana"** (clave i18n `editor.duplicateWeek`).
- Comportamiento: crea una **nueva semana** (insertada después de la semana origen, renumerando `number`) como copia profunda de la semana origen: copia días, entries y setGroups, generando **nuevos `id` (UUID) en cada setGroup** para no colisionar.
- Ajuste de pesos: ofrecer un input de **delta en kg (positivo o negativo)** que se **suma a `weightKg` de los set groups `WORKING`** de la semana duplicada (los `WARMUP` quedan igual, consistente con el duplicado de bloque por `WEIGHT`). Permitir delta 0 (copia idéntica). Evitar pesos negativos (clamp a 0 o validación).
- "Respecto a la anterior" = el delta se aplica sobre los pesos de la semana que se está duplicando.
- Usar un `BottomSheet`/modal para pedir el delta (reutilizar `frontend/src/components/BottomSheet.tsx` y el patrón de `DuplicateSheet.tsx`).

## Convenciones

- §3: identificadores (clases, campos, rutas, claves JSON, variables) en inglés. UI solo vía `es.json`. `userId` del JWT, nunca del body.
- `SetGroup.id` siempre UUID; al duplicar generar nuevos.
- `exerciseName`/`movementPattern` denormalizados en el entry al añadir/editar (como hoy).
- Mobile-first 375–430px sin overflow horizontal; respetar tokens y estilos existentes.

## Criterios de aceptación

- Abrir un bloque existente y pulsar Editar carga nombre, semanas, días, entries y setGroups; al guardar persiste vía `PUT /api/blocks/{id}` y refresca las listas.
- En el editor de día se pueden fijar `sets`, `reps`, `weightKg` (incl. 142.5) y `targetRpe` por set group, y eliminar set groups y entries. Un valor 142.5 no desborda en 375px.
- El overlay de día tiene "Guardar día" que cierra el overlay conservando los cambios en memoria; el bloque solo se persiste con el botón Guardar de nivel bloque.
- Backend: `PUT /api/exercises/{id}` actualiza un custom propio (200), 403 en seed global o de otro usuario, 404 si no existe. El usuario puede editar y borrar sus ejercicios custom desde el picker; los seeds globales no muestran esas acciones.
- "Duplicar semana" crea una semana nueva tras la origen con copia profunda (nuevos UUID en setGroups) y suma el delta en kg a los WORKING; WARMUP sin cambios; el bloque se guarda correctamente después.
- Backend: `./gradlew test` (o `mvnw test`) pasa, incluyendo tests del nuevo `PUT /api/exercises/{id}` (happy path propio, 403 seed/otro usuario, 404 inexistente).
- Frontend: `npm run test`, `npm run lint` y `npm run build` pasan en `frontend/`.
- Sin strings en español hardcodeados; todas las etiquetas nuevas en `es.json`.
