# Training Planner

A mobile-first PWA for planning and tracking powerlifting training.

**Stack:** Spring Boot 4.0 / Java 25 / MongoDB (backend) + React / Vite / TypeScript (frontend)

---

## Run steps

### Option A — Full stack with Docker (recommended)

The entire stack (MongoDB + backend + frontend) is containerized.

**Prerequisites:** Docker + Docker Compose.

```bash
docker compose up --build -d
```

- Frontend: `http://localhost:5173`
- Backend:  `http://localhost:8080/api/health`
- MongoDB:  `mongodb://localhost:27017/training_planner`

The backend reads its MongoDB connection string from the **`MONGO_URI`** environment
variable (set in `docker-compose.yml`, defaults to the bundled `mongodb` service).
Override it from the host or an `.env` file to point at an external cluster:

```bash
MONGO_URI="mongodb+srv://user:pass@cluster.example.net/training_planner" docker compose up --build -d
```

Stop with `docker compose down` (add `-v` to also drop the Mongo volume).

### Option B — Local dev (hot reload)

**Prerequisites:** Java 25 (JDK), Maven 3.9+, Node.js 20+, a running MongoDB.

```bash
# 1. MongoDB only
docker compose up -d mongodb

# 2. Backend (http://localhost:8080)
cd backend
mvn spring-boot:run

# 3. Frontend (http://localhost:5173, proxies /api to :8080)
cd frontend
npm install
npm run dev
```

Override the backend's MongoDB target locally with `MONGO_URI=... mvn spring-boot:run`.

---

## Run tests

### Backend

```bash
cd backend
mvn test
```

Uses embedded MongoDB (de.flapdoodle) — no running MongoDB required for tests.

### Frontend

```bash
cd frontend
npm test
```

---

## Project structure

```
omrep/
├── backend/              Spring Boot 4.0 + Java 25 (Maven)
│   ├── pom.xml           Maven build (Spring Boot 4.0.0, Java 25)
│   ├── Dockerfile        Multi-stage Maven build → JRE runtime
│   ├── src/main/java/com/trainingplanner/
│   │   ├── config/       Security, application config
│   │   ├── auth/ exercise/ block/ log/ progress/ export/ domain/
│   │   └── health/       Health check endpoint
│   └── src/test/java/
├── frontend/             React + Vite + TypeScript PWA
│   ├── Dockerfile        Multi-stage Node build → nginx
│   ├── nginx.conf        SPA fallback + /api proxy to backend
│   ├── src/
│   │   ├── locales/      es.json — all Spanish UI copy
│   │   ├── styles/       tokens.css — design tokens, global.css
│   │   └── ...           components, pages, api, auth
│   └── public/
├── docker-compose.yml    Full stack: mongodb + backend + frontend
└── README.md
```

---

## Architecture

- **Backend API** under `/api`. All endpoints except `/api/health` and `/api/auth/**` require a JWT Bearer token.
- **Per-user isolation:** every query is scoped to `userId` from the JWT (client-supplied IDs never trusted for ownership).
- **Virtual threads** enabled (`spring.threads.virtual.enabled=true`).
- **i18n:** all UI copy in Spanish via `src/locales/es.json`. No hardcoded Spanish strings in components.
- **Design tokens:** all visual decisions in `src/styles/tokens.css`. Components use `var(--token)` only.
