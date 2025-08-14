# ACDCars — prototyp aplikacji firmowej (Next.js → Docker → GHCR → Synology)

## 1) Lokalny start (dev)
```bash
npm install
npm run dev   # http://localhost:3000
```

## 2) CI/CD → GHCR
- Każdy push na `main` buduje obraz Dockera i publikuje go jako `ghcr.io/acdcars/app:latest`.
- Workflow: `.github/workflows/docker-publish.yml` — używa wbudowanego `GITHUB_TOKEN` do pushowania do GHCR (uprawnienia `packages: write`).

## 3) Synology NAS (Docker + Container Manager)
**Pierwsze wdrożenie** (SSH do NAS):
```bash
ssh admin@IP_NAS
mkdir -p /volume1/docker/acdcars && cd /volume1/docker/acdcars
# skopiuj tu pliki: docker-compose.yml, Caddyfile
# (np. przez File Station, scp lub git clone prywatnego repo z tymi dwoma plikami)
docker login ghcr.io -u GITHUB_USER -p <TOKEN_LUB_GITHUB_PAT>   # tylko jeśli obraz prywatny
docker compose up -d
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

**Aktualizacje** (automatyczne):
- Kontener `acdcars_watchtower` sprawdza co 5 minut nowy tag `latest`, pobiera i restartuje `acdcars_app`.
- Wymuszenie natychmiastowej aktualizacji:
```bash
docker pull ghcr.io/acdcars/app:latest && docker compose up -d
```

## 4) Reverse proxy (Caddy)
- Edytuj `Caddyfile` i podmień `app.example.com` oraz e‑mail w `tls`.
- Jeśli nie masz domeny, użyj wariantu `http://:80` (bez TLS).

## 5) Rollback (awaryjnie)
- Tymczasowo przypnij wersję, np. `image: ghcr.io/acdcars/app:sha-<commit>` w `docker-compose.yml` i `docker compose up -d`.

## 6) Rozwiązywanie problemów
```bash
docker logs acdcars_app --tail=80
docker logs acdcars_caddy --tail=80
docker logs acdcars_watchtower --tail=80
```

> Port aplikacji wewnątrz kontenera to 3000 (Caddy publikuje 80/443).
