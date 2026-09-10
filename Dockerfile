# syntax=docker/dockerfile:1
#
# EasyPanel: Build = Dockerfile. As duas variáveis NEXT_PUBLIC_* precisam
# estar disponíveis em BUILD-TIME (o Next.js as embute no bundle do cliente)
# — cadastre-as como Build Arguments no serviço do EasyPanel. As de servidor
# (APP_ENCRYPTION_KEY, ANTHROPIC_MODEL_PADRAO) vão em Environment (runtime).

# --- Etapa 1: dependências ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Etapa 2: build ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis públicas precisam estar no build-time (o Next.js as embute no
# bundle do cliente). As de servidor (chaves, APP_ENCRYPTION_KEY) entram só
# em runtime, via env_file do compose.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Ativa a saída standalone (enxuta) só aqui — localmente ela atrapalha
# `next start`.
ENV BUILD_STANDALONE=1
RUN npm run build

# --- Etapa 3: imagem final, enxuta ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
