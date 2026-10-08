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
| `NEXT_PUBLIC_SITE_URL` | **required in production** | Canonical / OG / sitemap / Origin checks (`https://…`, без `/` в кінці) |
| `TELEGRAM_BOT_TOKEN` | career form | Bot API |
| `TELEGRAM_CHAT_ID` | career form | Chat/group for applications |
| `DOMAIN` | Docker/nginx | Apex domain (напр. `levbarber.ua`) |
| `CERTBOT_EMAIL` | first TLS | Let's Encrypt |

Локально: `.env.example`. На сервері: `.env.production.example` → `.env`.

## Production (Docker + nginx)

Стек як у San San, але без Django/DB: **frontend + nginx + certbot**.

```bash
cp .env.production.example .env
# заповни DOMAIN, CERTBOT_EMAIL, NEXT_PUBLIC_SITE_URL, TELEGRAM_*

chmod +x scripts/*.sh docker-entrypoint.sh nginx/docker-entrypoint.sh
./scripts/init-letsencrypt.sh
```

Оновлення:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Renew TLS (cron раз на тиждень):

```bash
./scripts/renew-certs.sh
```

GitHub Actions: lint + typecheck + build на PR; на `main` — SSH deploy (`DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`).

## Scripts

- `npm run dev` / `build` / `start` / `lint`
- `npx tsc --noEmit` — typecheck
