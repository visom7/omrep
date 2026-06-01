# syntax=docker/dockerfile:1

# --- Build stage: compile the Vite/React PWA ---
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first for layer caching
COPY package.json package-lock.json* ./
RUN npm install

# Build the production bundle
COPY . .
RUN npm run build

# --- Runtime stage: serve static assets with nginx ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
