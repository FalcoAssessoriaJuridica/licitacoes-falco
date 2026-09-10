# Deploy — Supabase + EasyPanel

Projeto Supabase: **`djzlxcllzznrjqbtgnen`** · domínio **`licitacoes.falcotech.com.br`**.

## 1. Schema no Supabase

**Pelo painel:** SQL Editor → cole `supabase/deploy-fresh.sql` inteiro → Run.
É a concatenação das migrations `001 + 002 + 003`, idêntica ao local.
(As três já estão aplicadas no projeto atual; rodar de novo é seguro — tudo
`if not exists`.)

**Pela CLI** (com a conta dona do projeto): `supabase link --project-ref
djzlxcllzznrjqbtgnen && supabase db push`.

## 2. Auth no painel

Authentication → Providers: **Email** + **Google** (client id/secret do Google
Cloud). URL Configuration: Site `https://licitacoes.falcotech.com.br`,
Redirect `https://licitacoes.falcotech.com.br` e `http://localhost:3000`.

## 3. Seed (uma vez)

Precisa da **service_role key** (painel → Project Settings → API). No seu Mac,
`.env` apontando p/ produção + `SUPABASE_SERVICE_ROLE_KEY`, depois:

```bash
npm run seed:conhecimento      # 11 linhas globais em base_conhecimento
```

## 4. EasyPanel (igual ERP/CRM)

Serviço **App** → Source **GitHub** (`FalcoAssessoriaJuridica/licitacoes-falco`,
branch `main`) → Build **Nixpacks** (detecta Vite). Sem Dockerfile.

- Build: `npm run build`  ·  Start: `npm run start` (`serve -s dist -l $PORT`)
- **Build Arguments** (o Vite embute no bundle no build — precisam existir no build):
  | Nome | Valor |
  |---|---|
  | `VITE_SUPABASE_URL` | `https://djzlxcllzznrjqbtgnen.supabase.co` |
  | `VITE_SUPABASE_ANON_KEY` | *(anon key do painel — é pública)* |
- **Domains**: `licitacoes.falcotech.com.br` → porta do serviço, HTTPS on.
- Deploy no push da branch.

> Se após o deploy o login der erro de conexão com o Supabase: as Build
> Arguments não chegaram ao build. Confira que estão marcadas como
> disponíveis no build (não só runtime) e refaça o deploy.

## 5. Redeploy

`git push` → EasyPanel rebuilda. Mudou schema? Rode o passo 1 antes.
