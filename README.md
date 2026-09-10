# Plataforma de Licitações — Falco Assessoria Jurídica

App web para **defesa de licitantes/contratados** (CAIXA, Banco do Brasil,
Petrobras, Correios e órgãos sob a Lei 14.133/2021): organiza casos e **gera
peças fundamentadas** com a Claude, usando a base de conhecimento migrada da
skill `licitacoes-falco`.

- **Fase 1** (pronta): auth, tenants/usuários, CRUD de casos.
- **Fase 2** (pronta): base de conhecimento no banco · chave da Anthropic por
  usuário (criptografada) · wizard de geração de peça · histórico de versões.
- **Fase 3**: multi-provedor (OpenAI, Ollama local). **Fase 4**: multi-tenant
  comercial (onboarding, billing).

Stack: Next.js 15 (App Router) · Supabase (Postgres + Auth + RLS) · Tailwind ·
`@anthropic-ai/sdk`.

---

## Rodar localmente

Pré-requisitos: Node 22+, Docker, [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
# 1. Sobe Postgres + Auth locais (portas deslocadas +3000 p/ coexistir com
#    outro Supabase local — API em 57321). Aplica migrations 001 e 002.
npm run db:start
npm run db:reset

# 2. Configura o ambiente
cp .env.example .env.local
#   Preencha NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY com o
#   que `supabase status` imprime. Gere APP_ENCRYPTION_KEY:
openssl rand -base64 32        # cole em APP_ENCRYPTION_KEY no .env.local

# 3. Semeia a base de conhecimento (11 linhas globais, da skill licitacoes-falco)
npm run seed:conhecimento

# 4. Sobe o app
npm run build && npx next start -p 3000
#   (use `next start`, não `next dev` — ver nota no fim)
```

Acesse `http://localhost:3000` → cria conta → **Configurações** (cole sua chave
`sk-ant-...`) → **Novo caso** → **Gerar peça**.

### Migrations

`supabase/migrations/` é a fonte da verdade do schema. Ao mexer:

```bash
supabase migration new <slug>     # cria o arquivo
# edite, depois:
npm run db:reset                   # reaplica tudo do zero + re-seed manual
npm run seed:conhecimento
```

---

## Deploy

Supabase Cloud (projeto `djzlxcllzznrjqbtgnen`) + **EasyPanel** no VPS
(deploy via GitHub, build por Dockerfile, domínio e SSL geridos pelo EasyPanel).
Passo a passo completo em [`docs/DEPLOY.md`](docs/DEPLOY.md).

Resumo: schema (`supabase/deploy-fresh.sql` no SQL Editor, ou `supabase db push`)
→ Auth (Email + Google, URLs do domínio) → `npm run seed:conhecimento` apontado
para produção → serviço no EasyPanel (Build Args `NEXT_PUBLIC_*`, Environment
`APP_ENCRYPTION_KEY`/`ANTHROPIC_MODEL_PADRAO`, porta 3000, domínio) → `git push`.

`docker-compose.yml` é só para rodar local — o EasyPanel não o usa.

---

## Estrutura

```
app/
  login/                        auth (email/senha + Google)
  dashboard/                    lista de casos
  casos/novo/                   novo caso
  casos/[id]/                   detalhe + lista de peças
  casos/[id]/gerar/             wizard de geração
  casos/[id]/pecas/[pecaId]/    peça gerada (texto + prompt de auditoria)
  configuracoes/                chave da Anthropic do usuário
  api/casos/[id]/gerar-peca/    POST — monta prompt, chama Claude, grava peça
  api/configuracoes/            GET/PUT — config de LLM (chave criptografada)
lib/
  cripto.ts                     AES-256-GCM p/ a chave da Anthropic
  llm/anthropic.ts              adapter do @anthropic-ai/sdk
  prompts/sistema.ts            prompt base (gêmeo de system-prompt-portatil.md)
  prompts/montar.ts             seleção de conhecimento + montagem do prompt
  api/http.ts                   envelopes { data } / { error }
  supabase/                     clients (browser, server, middleware)
scripts/seed-base-conhecimento.mjs   migra ~/.claude/skills/licitacoes-falco → base_conhecimento
supabase/migrations/            001 (schema Fase 1) · 002 (conhecimento global + geração)
```

### Como a peça é montada

`api/casos/[id]/gerar-peca` → carrega o caso (RLS) e a config do usuário →
decifra a chave → `selecionarConhecimento()` pega **00-MESTRE** + o
**regulamento da entidade** do caso + as **fichas de doutrina da fase** →
`montarSystem()`/`montarConteudoUsuario()` → `gerarPeca()` (Anthropic) →
grava em `pecas_geradas` (versão = max+1) com `prompt_usado` para auditoria.

`base_conhecimento` com `tenant_id = null` é a base global (de fábrica); a
Fase 4 permite linhas por tenant que sobrescrevem por `slug`.

---

## Notas

- **`next dev` trava** neste caminho (há um `~/package-lock.json` solto que
  confunde a detecção de workspace; e `turbopack.root` no config faz o
  `next build` travar — por isso não está lá). Para desenvolver, use
  `npm run build && npx next start`. A saída `standalone` (Docker) só liga com
  `BUILD_STANDALONE=1`.
- O `.env.local` de desenvolvimento aponta para o Supabase **local** (57321).
- A chave da Anthropic **nunca** volta para o cliente; a API só informa
  `chave_configurada: true/false`.
