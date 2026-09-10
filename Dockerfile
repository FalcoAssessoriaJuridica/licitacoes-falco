# ── Stage 1: Build ───────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Serve com Nginx ──────────────────────────────────
FROM nginx:stable-alpine
WORKDIR /app

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=2s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/health || exit 1

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]

