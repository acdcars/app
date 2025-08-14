# syntax=docker/dockerfile:1.6

########################
# BUILD STAGE
########################
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Mniej hałasu, deterministyczny build
ENV NODE_ENV=development \
    npm_config_fund=false \
    npm_config_audit=false

# Narzędzia do modułów natywnych + git + certyfikaty
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pokaż wersje (łatwiej diagnozować w logach Actions)
RUN node -v && npm -v

# Najpierw tylko manifesty zależności (cache layer)
COPY package.json package-lock.json* ./

# Jeżeli jest lock -> npm ci; jeśli nie (awaryjnie) -> npm install
# Dodatkowe flagi poprawiają widoczność logów instalacji
RUN if [ -f package-lock.json ]; then \
      npm ci --include=dev --no-audit --no-fund --foreground-scripts; \
    else \
      npm install --include=dev --no-audit --no-fund --foreground-scripts; \
    fi

# Reszta źródeł + build Next
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

########################
# RUNTIME STAGE
########################
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Artefakty standalone z Next 15
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node","server.js"]
