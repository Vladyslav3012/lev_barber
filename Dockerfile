FROM node:22-bookworm-slim AS base

WORKDIR /app

ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# --- Development: hot reload ---
FROM base AS dev

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]

# --- Production: build standalone bundle ---
FROM base AS builder

ARG NEXT_PUBLIC_SITE_URL=""

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NODE_ENV=production

RUN npm run build

FROM node:22-bookworm-slim AS prod

WORKDIR /app

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

RUN mkdir -p .next/cache && chown node:node .next/cache

USER node

EXPOSE 3000

CMD ["node", "server.js"]
