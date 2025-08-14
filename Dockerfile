# --- Build stage (stabilny Debian slim, narzędzia do modułów native) ---
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Przyspieszenia i mniej hałasu
ENV NODE_ENV=development \
    npm_config_fund=false \
    npm_config_audit=false

# Narzędzia potrzebne do kompilacji ewentualnych modułów native
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Zależności (z lockiem lub bez)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --include=dev --no-audit --no-fund; \
    else \
      npm install --include=dev --no-audit --no-fund; \
    fi

# Reszta źródeł + build
COPY . .
# (opcjonalnie wyłącz telemetrię Next)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runtime stage (standalone) ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# pliki public i standalone serwer Next.js
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node","server.js"]
