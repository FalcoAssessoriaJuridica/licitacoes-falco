# Deploy — Supabase de produção + VPS

Projeto Supabase: **`djzlxcllzznrjqbtgnen`** · domínio **`licitacoes.falcotech.com.br`** (VPS Hostinger).

> **Acesso à CLI:** o `supabase` CLI desta máquina está logado numa conta que
> **não** enxerga `djzlxcllzznrjqbtgnen` (`supabase projects api-keys` → 403).
> Ou faça `supabase login` com a conta dona desse projeto, ou use o caminho
> pelo **painel** (abaixo), que não depende da CLI.

---

## 1. Schema no Supabase de produção

### Opção A — painel (recomendada, sem CLI)

1. Painel do projeto → **SQL Editor** → **New query**.
2. Cole o conteúdo inteiro de [`supabase/deploy-fresh.sql`](../supabase/deploy-fresh.sql)
   (é a concatenação de `migrations/001 + 002`, idêntica ao que roda no local).
3. **Run**. Deve terminar sem erro num projeto vazio.
4. Confira em **Table Editor**: `tenants`, `profiles`, `casos_licitacao`,
   `documentos_caso`, `pecas_geradas`, `configuracoes_llm_usuario`,
   `base_conhecimento` — todas com o cadeado de RLS.

### Opção B — CLI (depois de logar na conta certa)

```bash
supabase login                              # conta dona do projeto
supabase link --project-ref djzlxcllzznrjqbtgnen
supabase db push                            # aplica migrations/001 e 002 (pede a senha do banco)
```

`supabase init` **não** — o projeto já está inicializado.

---

## 2. Auth no painel

**Authentication → Providers**: habilite **Email** e **Google** (crie as
credenciais OAuth no Google Cloud Console, cole client id/secret).

**Authentication → URL Configuration**:
- Site URL: `https://licitacoes.falcotech.com.br`
- Redirect URLs: `https://licitacoes.falcotech.com.br/api/auth/callback`
  e `http://localhost:3000/api/auth/callback` (para testes)

---

## 3. Seed da base de conhecimento (uma vez)

Precisa da **service_role key** do projeto (painel → **Project Settings → API**).
Rode da sua máquina, apontando o `.env.local` para produção:

```bash
# .env.local temporário só para o seed:
NEXT_PUBLIC_SUPABASE_URL=https://djzlxcllzznrjqbtgnen.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key do painel>

npm run seed:conhecimento     # insere 11 linhas globais em base_conhecimento
```

Confirme no Table Editor: `base_conhecimento` com 11 linhas, `tenant_id` nulo.

---

## 4. Serviço no EasyPanel (deploy via GitHub + Dockerfile)

O EasyPanel cuida de build, domínio e SSL. **Não** se usa `docker-compose.yml`
nem proxy manual aqui (ele existe só para rodar local).

1. **GitHub**: com o projeto já num repo, no EasyPanel crie um serviço **App**
   → Source = **GitHub**, aponte o repo e a branch (ex.: `main`).
2. **Build** = **Dockerfile** (caminho: `Dockerfile`, contexto: raiz).
3. **Build Arguments** (build-time — o Next embute no bundle do cliente):
   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://djzlxcllzznrjqbtgnen.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<anon/public key do painel>` |
4. **Environment** (runtime):
   | Nome | Valor |
   |---|---|
   | `APP_ENCRYPTION_KEY` | `<openssl rand -base64 32>` — **gere uma vez, nunca mude** |
   | `ANTHROPIC_MODEL_PADRAO` | `claude-sonnet-4-5` |
   | `NEXT_PUBLIC_SUPABASE_URL` | idem (inofensivo repetir; usado por Server Components) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |

   `SUPABASE_SERVICE_ROLE_KEY` **não** entra aqui — só é usada localmente para
   rodar o seed (passo 3).

   > `APP_ENCRYPTION_KEY` cifra a chave da Anthropic de cada usuário. Trocá-la
   > invalida todas as chaves salvas. Guarde num cofre.
5. **Port**: `3000` (o container escuta em `PORT=3000`).
6. **Domains**: adicione `licitacoes.falcotech.com.br` → target port `3000`.
   Ative HTTPS (Let's Encrypt automático do EasyPanel). Confirme que o DNS do
   `falcotech.com.br` aponta o subdomínio para o IP do VPS.
7. **Deploy**: EasyPanel builda no push da branch. Acompanhe o log de build
   (a etapa `npm run build` roda com `BUILD_STANDALONE=1`, saída `standalone`).

> Se depois do deploy o login falhar com erro de conexão ao Supabase, os
> Build Arguments do passo 3 não chegaram ao build — confira que estão em
> **Build Arguments**, não só em Environment, e refaça o deploy.

---

## 5. Redeploy

`git push` na branch ligada → EasyPanel rebuilda e troca o container.
Mudou schema? Rode o passo 1 de novo (novo `deploy-fresh.sql` ou `db push`)
**antes** do push do código que depende dele.

---

## 6. Fumaça em produção

1. Abrir `https://licitacoes.falcotech.com.br` → redireciona para `/login`.
2. Criar conta → cai no dashboard (trigger criou tenant+profile).
3. **Configurações** → colar `sk-ant-…` → salvar (volta `chave_configurada: true`).
4. **Novo caso** (Correios / recurso-sanção) → **Gerar peça** → cola a decisão
   do PAD → deve gerar a peça e listar a versão 1.

---

## Atualizações futuras

Nova mudança de schema = novo arquivo em `supabase/migrations/` **e** regenerar
`supabase/deploy-fresh.sql` (ou `supabase db push` se a CLI estiver linkada).
Regras completas do fluxo em [`README.md`](../README.md).
