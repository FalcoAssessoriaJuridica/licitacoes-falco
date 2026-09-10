#!/usr/bin/env bash
# Regera supabase/deploy-fresh.sql a partir de todas as migrations, em ordem.
# Rode sempre que adicionar/alterar um arquivo em supabase/migrations/.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=supabase/deploy-fresh.sql
{
  echo "-- ============================================================"
  echo "-- DEPLOY FRESCO — Plataforma de Licitações Falco"
  echo "-- Gerado por scripts/regen-deploy-sql.sh — NÃO editar à mão."
  echo "-- Cole INTEIRO no SQL Editor de um projeto Supabase novo/vazio."
  echo "-- Depois rode 'npm run seed:conhecimento' com as chaves do projeto."
  echo "-- ============================================================"
  echo
  for f in supabase/migrations/*.sql; do
    echo "-- >>>>>>>>>> $(basename "$f") <<<<<<<<<<"
    cat "$f"
    echo
  done
} > "$OUT"

echo "OK — $OUT ($(wc -l < "$OUT" | tr -d ' ') linhas, $(ls supabase/migrations/*.sql | wc -l | tr -d ' ') migrations)"
