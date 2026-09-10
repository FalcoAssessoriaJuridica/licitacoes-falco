# ── Stage 1: Build ───────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia todo o código
COPY . .

# Variáveis de ambiente injetadas no build do Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_URI
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URI:-${VITE_SUPABASE_URL:-https://djzlxcllzznrjqbtgnen.supabase.co}}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqemx4Y2xsenpucmpxYnRnbmVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5OTU1MzEsImV4cCI6MjEwNDU3MTUzMX0.7ui1XU2jBPpDX8mSm1CSyZQepzqHNjPSsg0A-F1JWAA}

RUN npm run build

# ── Stage 2: Serve com Nginx ──────────────────────────────────
FROM nginx:stable-alpine
WORKDIR /app

# Copia apenas a pasta compilada
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração do nginx para SPA escutando na 80 e na 3000
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove a configuração padrão se o nginx criar um backup ou conflito
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 80 3000
CMD ["nginx", "-g", "daemon off;"]
