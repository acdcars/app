# ===== Etap 1: build =====
FROM node:20-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# instalacja zależności na podstawie lockfile
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# właściwy kod
COPY . .
# build Next.js (produkuje .next)
RUN npm run build

# ===== Etap 2: run (produkcja) =====
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000

# minimalny zestaw plików potrzebnych do startu
COPY --from=build /app/package*.json ./
COPY --from=build /app/next.config.* ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
# "npm start" uruchamia next start (tak jak lokalne "prod")
CMD ["npm","start"]