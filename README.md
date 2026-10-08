# LEV BARBER

Сайт барбершопу у Львові (Next.js). Запис через Alteg; форма «стати барбером» → Telegram.

## Local

```bash
cp .env.example .env
# заповни TELEGRAM_* якщо тестуєш форму
npm install
npm run dev
```

Відкрий [http://localhost:3000](http://localhost:3000).

## Env

| Variable | When | Purpose |
|----------|------|---------|
| `NEXT_PUBLIC_SITE_URL` | **required at build** | Canonical / OG / sitemap / Origin checks (`https://…`, без `/` в кінці). Вшивається в образ на `next build` (Dockerfile `ARG` / CI build-arg). Зміна домену → перезібрати frontend (`--build` або новий GHCR digest), самого `docker compose up` недостатньо |
| `TELEGRAM_BOT_TOKEN` | **required in prod** | Bot API (compose `:?` + Next instrumentation fail-fast; local API → 503) |
| `TELEGRAM_CHAT_ID` | **required in prod** | Chat/group for applications |
| `DOMAIN` | Docker/nginx | Apex domain (напр. `levbarber.ua`) |
| `CERTBOT_EMAIL` | first TLS | Let's Encrypt |
| `FRONTEND_IMAGE` / `NGINX_IMAGE` | production | GHCR `image@sha256:…` (CI пише в `.env.release`) |

Локально: `.env.example`. На сервері: `.env.production.example` → `.env`.

## Production (Docker + nginx)

Стек: **frontend + nginx + certbot**. Production-деплой тягне **immutable-образи з GHCR за digest** (без `git reset` / `docker compose build` на сервері).

```bash
cp .env.production.example .env
# заповни DOMAIN, CERTBOT_EMAIL, NEXT_PUBLIC_SITE_URL, TELEGRAM_*

chmod +x scripts/*.sh nginx/docker-entrypoint.sh
```

Перший TLS (після того як образи вже є — з CI або локальної збірки):

```bash
./scripts/init-letsencrypt.sh
```

Скрипт піднімає стек, чекає HTTP від **nginx** (не healthcheck Next), потім робить ACME webroot. Nginx стартує з `depends_on: service_started`, тож `/.well-known/acme-challenge` доступний навіть якщо frontend ще не healthy.

Локальний / bootstrap build (не CI-шлях):

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.prod.build.yml up --build -d
```

Renew TLS (cron раз на тиждень):

```bash
./scripts/renew-certs.sh
```

### CI/CD (GHCR)

```text
PR / main → lint + tsc + npm build
         → (main) build & push GHCR (sha-<commit>, main)
         → SCP compose + deploy-release.sh
         → docker pull @sha256 → up → healthcheck
         → success: .release-state; failure: auto-rollback
```

Образи (приватні пакети):

- `ghcr.io/<owner>/barber-frontend`
- `ghcr.io/<owner>/barber-nginx`

Теги `sha-<commit>` і `main` — для зручності; **на сервері завжди `…@sha256:…`**.

#### GitHub secrets / variables

| Name | Type | Purpose |
|------|------|---------|
| `DEPLOY_SSH_KEY` | secret | SSH private key |
| `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_PATH` | secret | SSH target |
| `DEPLOY_SSH_KNOWN_HOSTS` | secret | Pinned host key (не `ssh-keyscan` у CI) |
| `GHCR_PULL_TOKEN` | secret | PAT з `read:packages` (для private packages з private repo — також `repo`) |
| `GHCR_USERNAME` | secret (optional) | Login user; default — `repository_owner` |
| `NEXT_PUBLIC_SITE_URL` | variable або secret | Build-arg для frontend-образу (не runtime env) |

`DEPLOY_SSH_KNOWN_HOSTS` — закріплений host key сервера. Згенерувати локально після перевірки fingerprint:

```bash
ssh-keyscan -t ed25519,rsa YOUR_HOST 2>/dev/null | tee known_hosts
ssh-keygen -lf known_hosts   # звірити SHA256 з консоллю провайдера / першим trusted connect
```

Вміст `known_hosts` — у секрет `DEPLOY_SSH_KNOWN_HOSTS`.

Actions у workflow закріплені на повні commit SHA (не floating `@v4`).

#### Rollback

Автоматично: якщо новий реліз не стає healthy за тайм-аут, [`scripts/deploy-release.sh`](scripts/deploy-release.sh) повертає last known-good digests з `.release-state` і знову `pull` + `up`.

Вручну (відкат успішного, але поганого релізу на `PREVIOUS`):

```bash
cd "$DEPLOY_PATH"
# подивитись FRONTEND_PREVIOUS / NGINX_PREVIOUS
cat .release-state
export FRONTEND_IMAGE=…@sha256:…   # з PREVIOUS
export NGINX_IMAGE=…@sha256:…
export GHCR_USERNAME=…
export GHCR_PULL_TOKEN=…
./scripts/deploy-release.sh
```

#### DB / schema

Зараз БД немає. Якщо з’являться міграції або несумісні зміни схеми — планувати окрему rollback-стратегію (expand/contract); сам лише відкат образу може бути недостатнім.

## Scripts

- `npm run dev` / `build` / `start` / `lint`
- `npx tsc --noEmit` — typecheck
- `scripts/deploy-release.sh` — pull by digest, health wait, `.release-state`, auto-rollback
- `scripts/init-letsencrypt.sh` / `scripts/renew-certs.sh` — TLS
