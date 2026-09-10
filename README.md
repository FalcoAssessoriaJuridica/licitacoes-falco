# Falco — Licitações

App de defesa de licitantes/contratados: organiza casos e **gera peças
fundamentadas** com a base de conhecimento da skill `licitacoes-falco`.

**React + Vite** (mesma stack do ERP/CRM) · **Supabase** (Auth + Postgres + RLS)
· IA **provedor-agnóstica** chamada no navegador (qualquer API OpenAI-compatível,
Anthropic, Gemini, ou um modelo local / no seu servidor).

## Rodar local

```bash
cp .env.example .env      # já vem apontando p/ o Supabase de produção
npm install
npm run dev               # http://localhost:3000
```

`.env` — Vite só expõe ao cliente o que tem prefixo `VITE_`:

```
VITE_SUPABASE_URL=https://djzlxcllzznrjqbtgnen.supabase.co
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # só p/ o script de seed (node)
```

## Deploy (EasyPanel)

Igual aos outros projetos: serviço **App** → Source GitHub → **Nixpacks**
(detecta Vite). Build `npm run build`, start `npm run start`
(`serve -s dist -l $PORT`). Sem Docker, sem SSR.

**Build Arguments** (o Vite embute no bundle na hora do build):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Domínio `licitacoes.falcotech.com.br` → porta do serviço.

Passo a passo em [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Estrutura

```
src/
  pages/            Login · Dashboard · CasoNovo · CasoDetalhe · CasoGerar · Peca · Configuracoes
  components/       Layout · ProtectedRoute · ThemeMenu · StatusBadge · CopyButton
  contexts/         AuthContext (Supabase) · ThemeContext (4 temas × dark/light)
  services/         supabase.js · dados.js (todas as queries)
  lib/
    llm/index.js    adaptadores: openai-compat | anthropic | gemini (chamada no browser)
    prompts/        sistema.js + montar.js  (gêmeos da skill licitacoes-falco)
    rotulos.js
  styles/themes.css 4 temas: erp · editorial · precisao · chancelaria
supabase/migrations/  001 schema · 002 conhecimento global · 003 config LLM agnóstica
scripts/seed-base-conhecimento.mjs   migra ~/.claude/skills/licitacoes-falco -> base_conhecimento
```

## Temas

Seletor no cabeçalho e em Configurações. Cada tema define ~20 tokens CSS
(`--accent`, `--card-bg`, `--font-serif`, …); os componentes usam nomes neutros
(`bg-app-bg`, `text-main`, `btn-primary`, `card`, `badge`). `data-theme` +
classe `.dark`/`.light` no `<html>`, persistido em `localStorage`.

- **erp** — Executive Legal Luxury (ônix & ouro), do `DESIGN.md` do ERP
- **editorial** — papel, Newsreader, oxblood, filetes finos
- **precisao** — neutro frio, IBM Plex, numerais mono, tabela densa
- **chancelaria** — grafite profundo, Cormorant + Hanken, latão

## IA

`Configurações › Provedor de IA`: formato (OpenAI-compatível / Anthropic /
Gemini) + Base URL + chave + modelo, com presets e "Testar conexão". A chamada
sai do **navegador** — única forma de alcançar Ollama/LM Studio na sua máquina
ou um gateway no seu servidor; serve igual para API remota. Chave guardada na
linha do usuário em `configuracoes_llm_usuario`, protegida por RLS.
Para Ollama: rode com `OLLAMA_ORIGINS=*`.
