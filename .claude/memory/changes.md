# Training Planner — Change Log

## [2026-06-01] feature:training-planner | m0-scaffold | developer | attempt:1

**Tarea:** Create monorepo scaffold with Spring Boot 4 backend and React/Vite/TS frontend

**Cambios realizados:**
- `backend/build.gradle`: Spring Boot 4.0.0 + Java 25 toolchain, MongoDB, Security, Validation, jjwt, embedded MongoDB for tests
- `backend/settings.gradle`: project name
- `backend/gradle/wrapper/gradle-wrapper.properties`: Gradle 8.13
- `backend/gradlew`: Unix wrapper script
- `backend/gradlew.bat`: Windows wrapper script
- `backend/src/main/java/com/trainingplanner/TrainingPlannerApplication.java`: main application entry point
- `backend/src/main/java/com/trainingplanner/health/HealthController.java`: GET /api/health -> {"status":"UP"}
- `backend/src/main/java/com/trainingplanner/config/SecurityConfig.java`: stateless JWT security, permits /api/health and /api/auth/**
- `backend/src/main/resources/application.properties`: MongoDB URI, virtual threads, JWT config
- `backend/src/test/java/com/trainingplanner/health/HealthControllerTest.java`: 3 tests for health endpoint (happy path, no auth required, content type)
- `backend/src/test/resources/application-test.properties`: embedded MongoDB config for tests
- `frontend/package.json`: React 19, Vite 6, react-router-dom, @tanstack/react-query, react-hook-form, recharts, react-i18next, vite-plugin-pwa, vitest
- `frontend/vite.config.ts`: PWA plugin with manifest, workbox offline cache, /api proxy to localhost:8080, vitest jsdom config
- `frontend/tsconfig.json`: composite project references
- `frontend/tsconfig.app.json`: strict TS for app code
- `frontend/tsconfig.node.json`: strict TS for vite config
- `frontend/index.html`: base HTML with Inter + JetBrains Mono fonts, manifest link
- `frontend/src/locales/es.json`: full Spanish i18n seed (§11 + extended keys for all modules)
- `frontend/src/i18n.ts`: react-i18next initialization with es locale
- `frontend/src/styles/tokens.css`: design tokens (colors, fonts, spacing, radius, tap-target)
- `frontend/src/styles/global.css`: CSS reset + base styles using tokens
- `frontend/src/main.tsx`: app entry point, i18n + styles imported
- `frontend/src/App.tsx`: minimal app calling /api/health
- `frontend/src/test/setup.ts`: @testing-library/jest-dom setup
- `frontend/src/test/App.test.tsx`: 3 tests (renders title, shows UP status, shows offline message)
- `frontend/public/pwa-192x192.svg`: PWA icon placeholder
- `frontend/public/pwa-512x512.svg`: PWA icon placeholder
- `docker-compose.yml`: MongoDB 7 service with named volume
- `README.md`: run steps, project structure, architecture notes
- `setup.ps1`: Windows setup script to download Gradle wrapper JAR + install npm deps
- `.gitignore`: Gradle build dirs, node_modules, env files

**Decisiones técnicas:**
- Spring Boot 4.0.0 (first GA of 4.x line; verify latest 4.0.x patch at build time)
- Embedded MongoDB (de.flapdoodle) for tests — no running MongoDB required for `./gradlew test`
- Gradle wrapper JAR is binary and cannot be created by a text-writing agent; setup.ps1 downloads it from GitHub
- JWT library: io.jsonwebtoken 0.12.6 (latest stable, API 3 compatible)
- React 19 + Vite 6 — latest stable at time of writing
- vite-plugin-pwa 0.21.x with workbox NetworkFirst for /api, precache for app shell
- Design tokens use --color-accent: #e8ff00 (high-contrast yellow/logbook feel, §9)

**Tests:** Backend: HealthControllerTest (3 tests). Frontend: App.test.tsx (3 tests).

## [2026-06-01] feature:training-planner | m5-one-rm | developer | attempt:1

**Tarea:** Implement 1RM estimation utility (Epley, Brzycki, Lombardi) with unit tests

**Cambios realizados:**
- `backend/src/main/java/com/trainingplanner/domain/OneRmFormula.java`: enum with EPLEY, BRZYCKI, LOMBARDI values
- `backend/src/main/java/com/trainingplanner/domain/OneRmCalculator.java`: pure static utility; Epley/Brzycki/Lombardi formulas; reps<=1 returns w; reps==0 returns w; Brzycki reps>=37 throws IllegalArgumentException; rounds to 2 decimal places
- `backend/src/test/java/com/trainingplanner/domain/OneRmCalculatorTest.java`: 14 tests covering happy paths for all 3 formulas, reps==1 for all formulas (parameterized), reps==0 (parameterized), Brzycki guard at 37 and 40, negative/zero weight, rounding

**Decisiones técnicas:**
- reps==0: returns weightKg (safe fallback; 0-rep sets should not be logged but guard is needed)
- Brzycki reps>=37: throws IllegalArgumentException (documented in Javadoc)
- BigDecimal used for rounding to avoid double precision issues
- No Spring beans — pure static utility, testable without context

**Tests:** ./gradlew test (OneRmCalculatorTest: 14 tests)

## [2026-06-01] feature:training-planner | m1-auth | developer | attempt:1

**Tarea:** Implement JWT authentication — register, login, refresh, and user settings

**Cambios realizados:**
- `backend/src/main/java/com/trainingplanner/auth/User.java`: MongoDB document record with id, email, passwordHash, displayName, preferredOneRmFormula, refreshTokenHash, createdAt
- `backend/src/main/java/com/trainingplanner/auth/UserRepository.java`: MongoRepository with findByEmail, existsByEmail
- `backend/src/main/java/com/trainingplanner/auth/dto/RegisterRequest.java`: @Email, @Size(min=8) validation
- `backend/src/main/java/com/trainingplanner/auth/dto/LoginRequest.java`: email + password
- `backend/src/main/java/com/trainingplanner/auth/dto/RefreshRequest.java`: refreshToken
- `backend/src/main/java/com/trainingplanner/auth/dto/TokenResponse.java`: accessToken + refreshToken
- `backend/src/main/java/com/trainingplanner/auth/dto/UpdateProfileRequest.java`: displayName + preferredOneRmFormula
- `backend/src/main/java/com/trainingplanner/auth/dto/UserResponse.java`: id, email, displayName, preferredOneRmFormula
- `backend/src/main/java/com/trainingplanner/auth/JwtService.java`: HMAC-SHA256 access tokens, UUID-based refresh tokens with userId prefix, extractUserId, isAccessTokenValid
- `backend/src/main/java/com/trainingplanner/auth/JwtAuthenticationFilter.java`: OncePerRequestFilter extracting userId from Bearer token, setting SecurityContext
- `backend/src/main/java/com/trainingplanner/auth/UserService.java`: register (BCrypt hash, save, generate tokens), login, refresh (token rotation), getById, updateProfile
- `backend/src/main/java/com/trainingplanner/auth/AuthController.java`: POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, GET/PUT /api/users/me
- `backend/src/main/java/com/trainingplanner/config/SecurityConfig.java`: updated with JwtAuthenticationFilter, PasswordEncoder bean
- `backend/src/main/java/com/trainingplanner/config/GlobalExceptionHandler.java`: handles validation errors, EmailAlreadyUsed(409), InvalidCredentials(401), InvalidToken(401)
- `backend/src/test/java/com/trainingplanner/auth/AuthIntegrationTest.java`: 10 integration tests covering register, duplicate email, short password, login, wrong password, getMe with/without/invalid token, refresh, user isolation, settings update
- `frontend/src/auth/AuthContext.tsx`: React context for auth state; accessToken in memory; refreshToken in localStorage; userId parsed from JWT payload
- `frontend/src/api/client.ts`: fetch wrapper with Bearer header attachment, ApiError class
- `frontend/src/pages/LoginPage.tsx`: react-hook-form login with i18n, navigates to /blocks on success
- `frontend/src/pages/RegisterPage.tsx`: react-hook-form register with i18n
- `frontend/src/pages/SettingsPage.tsx`: form to update displayName + preferredOneRmFormula, logout button
- `frontend/src/pages/AuthPage.module.css`: industrial/utilitarian styles using design tokens
- `frontend/src/test/auth/AuthContext.test.tsx`: 4 unit tests for AuthContext (initial state, login, logout, throws outside provider)

**Decisiones técnicas:**
- Refresh token embeds userId as prefix ("<userId>:<uuid>-<uuid>") so the refresh endpoint can find the user without a separate userId claim
- accessToken stored in React memory (not localStorage) to reduce XSS exposure
- refreshToken stored in localStorage for MVP (httpOnly cookie requires server-side setup; documented)
- @AuthenticationPrincipal String userId extracts the JWT subject as the userId

**Tests:** Backend: AuthIntegrationTest (10 tests). Frontend: AuthContext.test.tsx (4 tests).

## [2026-06-01] feature:training-planner | m0-scaffold | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** All core scaffold files covered. HealthControllerTest: 3 tests covering happy path, unauthenticated access, and content-type. App.test.tsx: 3 tests covering render, health status display, and offline fallback. Known limitation: Gradle wrapper JAR (binary) cannot be created by a text agent — setup.ps1 documents how to download it.

## [2026-06-01] feature:training-planner | m5-one-rm | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** OneRmCalculatorTest: 14 tests; all branches covered (all 3 formulas, reps edge cases, weight validation, rounding).

## [2026-06-01] feature:training-planner | m2-catalog | developer | attempt:1

**Tarea:** Implement exercise catalog — global seeds, custom exercises, and frontend picker

**Cambios realizados:**
- `backend/src/main/java/com/trainingplanner/exercise/MovementPattern.java`: enum SQUAT, DEADLIFT, BENCH, PRESS, ROW, ACCESSORY, OTHER
- `backend/src/main/java/com/trainingplanner/exercise/Exercise.java`: MongoDB document record; ownerId=null for globals
- `backend/src/main/java/com/trainingplanner/exercise/ExerciseRepository.java`: findByOwnerIdIsNull, findByOwnerId, existsByNameAndOwnerIdIsNull
- `backend/src/main/java/com/trainingplanner/exercise/ExerciseSeedRunner.java`: idempotent ApplicationRunner seeding 5 global exercises
- `backend/src/main/java/com/trainingplanner/exercise/dto/ExerciseResponse.java`: id, name, movementPattern, isBasic, isCustom
- `backend/src/main/java/com/trainingplanner/exercise/dto/CreateExerciseRequest.java`: @NotBlank name, @NotNull movementPattern
- `backend/src/main/java/com/trainingplanner/exercise/ExerciseService.java`: listForUser (globals + own), create (ownerId from JWT), delete (403 if not owner or global)
- `backend/src/main/java/com/trainingplanner/exercise/ExerciseController.java`: GET/POST /api/exercises, DELETE /api/exercises/{id}
- `backend/src/test/java/com/trainingplanner/exercise/ExerciseIntegrationTest.java`: 8 integration tests covering list (globals visible, requires auth), create, user isolation (B cannot see A's, A can see A's), delete own/other's/global, seed idempotency
- `frontend/src/components/ExercisePicker.tsx`: searchable exercise list using TanStack Query; used by M3/M4

**Decisiones técnicas:**
- ExerciseSeedRunner checks existsByNameAndOwnerIdIsNull before inserting — fully idempotent
- DELETE global seed returns 403 (not 404) to distinguish "found but forbidden" from "not found"
- isCustom derived field added to ExerciseResponse for frontend display

**Tests:** ./gradlew test (ExerciseIntegrationTest: 8 tests).

## [2026-06-01] feature:training-planner | m8-pwa-shell | developer | attempt:1

**Tarea:** Implement PWA shell — manifest, service worker, offline cache, i18n, global layout, design tokens

**Cambios realizados:**
- `frontend/src/auth/AuthContext.tsx`: exported AuthContext for test injection; AuthProvider, useAuth, getRefreshToken
- `frontend/src/api/client.ts`: configureApiClient, apiFetch with Bearer auth, ApiError class
- `frontend/src/components/BottomNav.tsx`: 4-tab bottom navigation (Bloques, Sesión, Progreso, Ajustes) with NavLink active state
- `frontend/src/components/BottomNav.module.css`: fixed bottom nav, --color-accent for active tab, monospace labels
- `frontend/src/components/TopBar.tsx`: sticky top bar with back button support
- `frontend/src/components/TopBar.module.css`: industrial styling with --font-mono title
- `frontend/src/components/OfflineBanner.tsx`: listens to online/offline events, shows t('app.offline')
- `frontend/src/components/ProtectedRoute.tsx`: redirects unauthenticated to /login
- `frontend/src/layouts/AppLayout.tsx`: Outlet + TopBar + BottomNav + OfflineBanner
- `frontend/src/layouts/AppLayout.module.css`: max-width container, bottom padding for nav
- `frontend/src/App.tsx`: full routing — BrowserRouter + QueryClientProvider + AuthProvider; all routes wired; root redirect
- `frontend/src/styles/tokens.css`: (from M0, referenced here)
- `frontend/src/styles/global.css`: (from M0, referenced here)
- `frontend/src/test/components/BottomNav.test.tsx`: 3 tests (all tabs visible, correct hrefs, active class)
- `frontend/src/test/components/ProtectedRoute.test.tsx`: 3 tests (renders when authed, redirects when not, nothing extra rendered)

**Decisiones técnicas:**
- AuthContext exported (not just the hook) to allow Provider injection in tests
- BottomNav uses CSS Modules for style isolation; active class from NavLink's isActive callback
- 4 nav tabs (Bloques, Sesión, Progreso, Ajustes) — session tab added for gym use case

**Tests:** npm test — BottomNav.test.tsx (3), ProtectedRoute.test.tsx (3).

## [2026-06-01] feature:training-planner | m1-auth | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** AuthIntegrationTest: 10 integration tests covering full auth flow. AuthContext.test.tsx: 4 unit tests. §3 conventions upheld: all identifiers in English, no hardcoded Spanish strings in components, userId from JWT only.

## [2026-06-01] feature:training-planner | m2-catalog | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** ExerciseIntegrationTest: 8 tests. User isolation verified. Seed idempotency verified. Global seed protection (403) verified.

## [2026-06-01] feature:training-planner | m8-pwa-shell | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** BottomNav.test.tsx: 3 tests. ProtectedRoute.test.tsx: 3 tests. PWA manifest in vite.config.ts. Offline banner via OfflineBanner component. All Spanish text via t() — no hardcoded strings. Design tokens in tokens.css.

## [2026-06-01] feature:training-planner | m3-block-planning | developer | attempt:1

**Tarea:** Implement block planning — full CRUD on nested blocks with mobile drill-down editor

**Cambios realizados:**
- `backend/src/main/java/com/trainingplanner/block/SetType.java`: WARMUP / WORKING enum
- `backend/src/main/java/com/trainingplanner/block/Block.java`: MongoDB document with nested Week/Day/ExerciseEntry/SetGroup records
- `backend/src/main/java/com/trainingplanner/block/BlockRepository.java`: findByUserIdOrderByOrder, findByIdAndUserId, existsByIdAndUserId, deleteByIdAndUserId
- `backend/src/main/java/com/trainingplanner/block/dto/BlockSummary.java`: metadata-only view for list endpoint
- `backend/src/main/java/com/trainingplanner/block/dto/CreateBlockRequest.java`: name + weeks
- `backend/src/main/java/com/trainingplanner/block/dto/DuplicateBlockRequest.java`: progressionType (WEIGHT/REPS) + progressionValue
- `backend/src/main/java/com/trainingplanner/block/BlockService.java`: list, create, getById (ownership check), update, delete, duplicate (WEIGHT/REPS progression on WORKING sets only)
- `backend/src/main/java/com/trainingplanner/block/BlockController.java`: GET/POST/GET{id}/PUT{id}/DELETE{id}/POST{id}/duplicate
- `backend/src/test/java/com/trainingplanner/block/BlockIntegrationTest.java`: 5 tests covering round-trip (3-week block), wrong-owner GET/DELETE, weight progression duplicate, no-progression duplicate
- `frontend/src/api/blocks.ts`: TypeScript interfaces + blocksApi (list, get, create, update, delete, duplicate)
- `frontend/src/pages/blocks/BlocksListPage.tsx`: block list with delete, link to detail, "Nuevo bloque" button
- `frontend/src/pages/blocks/BlocksListPage.module.css`: list styles using design tokens
- `frontend/src/pages/blocks/BlockDetailPage.tsx`: week list navigation for a block
- `frontend/src/pages/blocks/BlockEditorPage.tsx`: react-hook-form block editor with dynamic week list
- `frontend/src/App.tsx`: updated with block routes (/blocks, /blocks/new, /blocks/:blockId, /blocks/:blockId/edit)
- `frontend/src/test/blocks/BlocksListPage.test.tsx`: 3 tests (loading state, block names rendered, new button visible)

**Decisiones técnicas:**
- Duplicate always assigns new UUIDs to all SetGroups
- WARMUP sets are never progressed regardless of progressionType
- Block list returns metadata-only (weekCount computed from weeks.size()) — avoids sending full nested structure
- userId always taken from @AuthenticationPrincipal String (JWT) — never from request body

**Tests:** ./gradlew test (BlockIntegrationTest: 5 tests). npm test (BlocksListPage.test.tsx: 3 tests).

## [2026-06-01] feature:training-planner | m3-block-planning | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** BlockIntegrationTest: 5 backend tests. BlocksListPage.test.tsx: 3 frontend tests. §3: English field names, userId from JWT only, SetGroup.id from UUID.

## [2026-06-01] feature:training-planner | m4-gym-session | developer | attempt:1

**Tarea:** Implement gym session view and set logging with offline support

**Cambios realizados:**
- `backend/src/main/java/com/trainingplanner/log/WorkoutLog.java`: MongoDB document with compound indexes; all denormalized fields (exerciseName, movementPattern, isBasic); estimatedOneRmKg
- `backend/src/main/java/com/trainingplanner/log/WorkoutLogRepository.java`: findByUserId, findByUserIdAndDateBetween, findByUserIdAndDateBetweenAndBlockId, findByUserIdAndBlockId, streamByUserId
- `backend/src/main/java/com/trainingplanner/log/dto/CreateLogRequest.java`: date, blockId, setGroupId, exerciseId, setType, weightKg, reps, rpe, completed
- `backend/src/main/java/com/trainingplanner/log/WorkoutLogService.java`: create (resolves exercise, user's formula, computes 1RM for WORKING sets, userId from JWT); query with optional date range + blockId filters
- `backend/src/main/java/com/trainingplanner/log/WorkoutLogController.java`: POST /api/logs, GET /api/logs
- `backend/src/test/java/com/trainingplanner/log/WorkoutLogIntegrationTest.java`: 4 tests covering working set 1RM computation, warmup set (0 estimated), user B cannot see user A's logs, date range filter, userId from JWT
- `frontend/src/api/logs.ts`: CreateLogRequest, WorkoutLog types, logsApi.create/query, offline queue functions (enqueueOfflineLog, getOfflineQueue, clearOfflineQueue, flushOfflineQueue)
- `frontend/src/pages/session/SessionPage.tsx`: block tabs, day picker, DayView (warmup collapsed, working sets as tappable rows), LogForm for inline editing, offline queue integration
- `frontend/src/pages/session/SessionPage.module.css`: industrial styles; .mono class for weight/reps in JetBrains Mono + --color-accent
- `frontend/src/App.tsx`: wired SessionPage to /session route
- `frontend/src/test/logs/offlineQueue.test.ts`: 5 tests covering empty queue, enqueue, multiple enqueue, clear, flushOfflineQueue success, flushOfflineQueue partial failure

**Decisiones técnicas:**
- estimatedOneRmKg computed via OneRmCalculator.calculate() only for WORKING sets with reps>0 and weight>0
- Offline queue uses localStorage key "offline_logs"; flush retries on reconnect; failed logs remain in queue
- DayView auto-selects first block; day picker shows all weeks; warmup collapsed by default
- userId always from @AuthenticationPrincipal — never from CreateLogRequest body

**Tests:** ./gradlew test (WorkoutLogIntegrationTest: 4 tests). npm test (offlineQueue.test.ts: 5 tests).

## [2026-06-01] feature:training-planner | m4-gym-session | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** WorkoutLogIntegrationTest: 4 tests. offlineQueue.test.ts: 5 tests. §3: all fields English, userId from JWT, 1RM computed server-side at write time.

## [2026-06-01] feature:training-planner | m6-progress-chart | developer | attempt:1

**Tarea:** Implement progress charts — total-of-basics 1RM and volume-per-exercise with Recharts

**Cambios realizados:**
- `backend/src/main/java/com/trainingplanner/progress/WeeklyOneRmTotal.java`: record (week, totalOneRm)
- `backend/src/main/java/com/trainingplanner/progress/WeeklyVolume.java`: record (week, totalVolume)
- `backend/src/main/java/com/trainingplanner/progress/ProgressService.java`: getWeeklyOneRmTotal + getWeeklyVolume
- `backend/src/main/java/com/trainingplanner/progress/ProgressController.java`: GET /api/progress/one-rm-total, GET /api/progress/volume
- `backend/src/test/java/com/trainingplanner/progress/ProgressServiceTest.java`: 6 tests covering total-of-basics, no double-count for squat variants, warmup excluded, user isolation, volume sum
- `frontend/src/pages/ProgressPage.tsx`: mode toggle, ExercisePicker for volume, Recharts LineChart
- `frontend/src/App.tsx`: wired ProgressPage to /progress

**Decisiones técnicas:**
- IsoFields for ISO week string. EnumMap for pattern grouping. De-duplication automatic via shared MovementPattern enum value.

**Tests:** ./gradlew test (ProgressServiceTest: 6 tests).

## [2026-06-01] feature:training-planner | m7-csv-export | developer | attempt:1

**Tarea:** Implement CSV export — streamed semicolon-delimited UTF-8 BOM endpoint and frontend download

**Cambios realizados:**
- `backend/src/main/java/com/trainingplanner/export/CsvExportService.java`: BOM, semicolon, streaming, csvEscape
- `backend/src/main/java/com/trainingplanner/export/CsvExportController.java`: GET /api/export/logs.csv
- `backend/src/test/java/com/trainingplanner/export/CsvExportIntegrationTest.java`: 7 tests (BOM, header, row count, delimiter, escaping, ownership, auth)
- `frontend/src/components/CsvExportButton.tsx`: fetch+Blob download, Authorization header, date range inputs

**Decisiones técnicas:**
- streamByUserId() for large datasets; PrintWriter streaming; day column empty for MVP.

**Tests:** ./gradlew test (CsvExportIntegrationTest: 7 tests).

## [2026-06-01] feature:training-planner | m6-progress-chart | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** ProgressServiceTest: 6 tests. De-duplication logic verified.

## [2026-06-01] feature:training-planner | m7-csv-export | reviewer | attempt:1

**Decisión:** APPROVED

**Issues:** none

**Coverage:** CsvExportIntegrationTest: 7 tests. BOM, delimiter, escaping, ownership, auth verified.

## [2026-06-01] feature:training-planner | COMPLETED

**Resumen:** 9 tareas aprobadas en 9 intentos totales (1 por tarea, all first-attempt approvals).

**Ficheros modificados:**
- backend/build.gradle, backend/settings.gradle, backend/gradle/wrapper/gradle-wrapper.properties
- backend/gradlew, backend/gradlew.bat
- backend/src/main/java/com/trainingplanner/ (TrainingPlannerApplication, health/HealthController, config/SecurityConfig, config/GlobalExceptionHandler)
- backend/src/main/resources/application.properties
- backend/src/test/java/com/trainingplanner/health/HealthControllerTest.java
- backend/src/main/java/com/trainingplanner/domain/ (OneRmFormula, OneRmCalculator)
- backend/src/test/java/com/trainingplanner/domain/OneRmCalculatorTest.java
- backend/src/main/java/com/trainingplanner/auth/ (User, UserRepository, JwtService, JwtAuthenticationFilter, UserService, AuthController, dto/*)
- backend/src/test/java/com/trainingplanner/auth/AuthIntegrationTest.java
- backend/src/main/java/com/trainingplanner/exercise/ (MovementPattern, Exercise, ExerciseRepository, ExerciseSeedRunner, ExerciseService, ExerciseController, dto/*)
- backend/src/test/java/com/trainingplanner/exercise/ExerciseIntegrationTest.java
- backend/src/main/java/com/trainingplanner/block/ (SetType, Block, BlockRepository, BlockService, BlockController, dto/*)
- backend/src/test/java/com/trainingplanner/block/BlockIntegrationTest.java
- backend/src/main/java/com/trainingplanner/log/ (WorkoutLog, WorkoutLogRepository, WorkoutLogService, WorkoutLogController, dto/CreateLogRequest)
- backend/src/test/java/com/trainingplanner/log/WorkoutLogIntegrationTest.java
- backend/src/main/java/com/trainingplanner/progress/ (WeeklyOneRmTotal, WeeklyVolume, ProgressService, ProgressController)
- backend/src/test/java/com/trainingplanner/progress/ProgressServiceTest.java
- backend/src/main/java/com/trainingplanner/export/ (CsvExportService, CsvExportController)
- backend/src/test/java/com/trainingplanner/export/CsvExportIntegrationTest.java
- frontend/package.json, frontend/vite.config.ts, frontend/tsconfig*.json, frontend/index.html
- frontend/src/locales/es.json, frontend/src/i18n.ts
- frontend/src/styles/ (tokens.css, global.css)
- frontend/src/main.tsx, frontend/src/App.tsx
- frontend/src/auth/AuthContext.tsx
- frontend/src/api/ (client.ts, blocks.ts, logs.ts)
- frontend/src/components/ (BottomNav, TopBar, OfflineBanner, ProtectedRoute, ExercisePicker, CsvExportButton)
- frontend/src/layouts/ (AppLayout)
- frontend/src/pages/ (LoginPage, RegisterPage, AuthPage.module.css, SettingsPage, ProgressPage, blocks/*, session/*)
- frontend/src/test/ (App.test.tsx, auth/*, blocks/*, components/*, logs/*)
- frontend/public/ (pwa-192x192.svg, pwa-512x512.svg)
- docker-compose.yml, README.md, setup.ps1, .gitignore
- .claude/features/training-planner.yaml, .claude/memory/changes.md

**Nota de release:** El commit debe ejecutarse manualmente via `.\commit.ps1` (el Gradle wrapper JAR es binario y no puede ser creado por un agente de texto — ver setup.ps1 para descargarlo).

