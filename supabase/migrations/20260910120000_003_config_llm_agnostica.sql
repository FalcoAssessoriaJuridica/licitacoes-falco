-- ============================================================
-- FASE 3 (Vite) — config de LLM provedor-agnóstica por usuário.
-- A chamada ao modelo roda no NAVEGADOR; guardamos aqui só a
-- configuração, protegida pela RLS (own row) que já existe.
-- ============================================================

alter table configuracoes_llm_usuario
  add column if not exists formato text not null default 'openai',
  add column if not exists base_url text,
  add column if not exists api_key text,
  add column if not exists modelo text;

comment on column configuracoes_llm_usuario.formato is
  'formato de fio: openai | anthropic | gemini';
comment on column configuracoes_llm_usuario.api_key is
  'chave crua do provedor do usuário — protegida por RLS (own row). Upgrade futuro: Supabase Vault.';

-- migra dados antigos, se houver
update configuracoes_llm_usuario
   set modelo = coalesce(modelo, modelo_padrao),
       api_key = coalesce(api_key, api_key_criptografada)
 where modelo is null or api_key is null;
