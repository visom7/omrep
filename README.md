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

## Publish images to Docker Hub

The backend and frontend are published as two separate images under the
**`visom77`** Docker Hub account.

**Prerequisites:** Docker, and a Docker Hub account with push access to `visom77`.

```bash
# 1. Log in to Docker Hub (once per machine)
docker login -u visom77

# 2. Build the images (run from the repo root)
docker build -t visom77/training-planner-backend:latest ./backend
docker build -t visom77/training-planner-frontend:latest ./frontend

# 3. Push to Docker Hub
docker push visom77/training-planner-backend:latest
docker push visom77/training-planner-frontend:latest
```

To publish a versioned release, tag with the version as well as `latest`:

```bash
VERSION=1.0.0

docker build -t visom77/training-planner-backend:$VERSION -t visom77/training-planner-backend:latest ./backend
docker build -t visom77/training-planner-frontend:$VERSION -t visom77/training-planner-frontend:latest ./frontend

docker push visom77/training-planner-backend:$VERSION
docker push visom77/training-planner-backend:latest
docker push visom77/training-planner-frontend:$VERSION
docker push visom77/training-planner-frontend:latest
```

> **Building on Apple Silicon / ARM for an amd64 server?** Use Buildx to build and
> push a multi-arch image in one step:
>
> ```bash
> docker buildx build --platform linux/amd64,linux/arm64 \
>   -t visom77/training-planner-backend:latest ./backend --push
> docker buildx build --platform linux/amd64,linux/arm64 \
>   -t visom77/training-planner-frontend:latest ./frontend --push
> ```

---

## Production deployment (Portainer + external MongoDB)

For the mini-PC deployment, use **`docker-compose.prod.yml`**. Unlike
`docker-compose.yml` (which builds images and bundles MongoDB for local dev),
this stack pulls the prebuilt images from the registry and connects to an
**external MongoDB** — no bundled `mongodb` service.

Define these environment variables in the Portainer stack's
**Environment variables** section (they only take effect when the stack is
recreated):

| Variable | Example |
| --- | --- |
| `REGISTRY` | `visom77` |
| `MONGO_URI` | `mongodb://user:pass@192.168.1.102:27017/training_planner?authSource=admin` |
| `JWT_ACCESS_SECRET` | an HS256 secret, at least 32 bytes |

Ports published by the stack: frontend on `91`, backend on `8091`.

> If the backend log shows `localhost:27017` at startup, `MONGO_URI` is empty —
> the variable is not defined in the stack. An empty `MONGO_URI` makes the Mongo
> driver fall back to its `localhost:27017` default rather than the
> `application.properties` value.

The external MongoDB must accept LAN connections: `bindIp` including `0.0.0.0`
(or the host IP), the auth user present in `authSource`, and the firewall
allowing `27017`.

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
├── docker-compose.yml       Local dev: mongodb + backend + frontend (builds images)
├── docker-compose.prod.yml  Production (Portainer): registry images + external MongoDB
└── README.md
```

---

## Architecture

- **Backend API** under `/api`. All endpoints except `/api/health` and `/api/auth/**` require a JWT Bearer token.
- **Per-user isolation:** every query is scoped to `userId` from the JWT (client-supplied IDs never trusted for ownership).
- **Virtual threads** enabled (`spring.threads.virtual.enabled=true`).
- **i18n:** all UI copy in Spanish via `src/locales/es.json`. No hardcoded Spanish strings in components.
- **Design tokens:** all visual decisions in `src/styles/tokens.css`. Components use `var(--token)` only.
