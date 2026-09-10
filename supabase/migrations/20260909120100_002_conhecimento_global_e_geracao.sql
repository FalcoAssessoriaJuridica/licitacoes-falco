-- ============================================================
-- FASE 2 — base de conhecimento global + metadados de geração de peça
-- ============================================================

-- ------------------------------------------------------------
-- 1. BASE DE CONHECIMENTO: linhas GLOBAIS (tenant_id nulo) que
--    valem para todos os tenants — é o "estilo Falco" de fábrica,
--    migrado da skill licitacoes-falco. Um tenant pode, no futuro
--    (Fase 4), criar linhas próprias que sobrescrevem por slug.
-- ------------------------------------------------------------
alter table base_conhecimento alter column tenant_id drop not null;

alter table base_conhecimento add column if not exists slug text;
alter table base_conhecimento add column if not exists fases fase_caso[] not null default '{}';
alter table base_conhecimento add column if not exists ordem int not null default 0;

-- slug único entre as linhas globais; e único por tenant nas linhas próprias
create unique index if not exists uq_conhecimento_slug_global
  on base_conhecimento (slug) where tenant_id is null;
create unique index if not exists uq_conhecimento_slug_tenant
  on base_conhecimento (tenant_id, slug) where tenant_id is not null;

-- leitura: linha global OU do próprio tenant
drop policy if exists "select conhecimento do proprio tenant" on base_conhecimento;
create policy "select conhecimento global ou do tenant"
  on base_conhecimento for select
  using (tenant_id is null or tenant_id = tenant_id_atual());

-- escrita continua restrita ao próprio tenant (linhas globais só via service role no seed)

-- ------------------------------------------------------------
-- 2. PEÇAS GERADAS: metadados para auditoria e para a listagem
-- ------------------------------------------------------------
alter table pecas_geradas add column if not exists titulo text;
alter table pecas_geradas add column if not exists fase fase_caso;
alter table pecas_geradas add column if not exists entidade entidade_contratante;
alter table pecas_geradas add column if not exists prompt_usado text;
alter table pecas_geradas add column if not exists tokens_entrada int;
alter table pecas_geradas add column if not exists tokens_saida int;

-- ------------------------------------------------------------
-- 3. updated_at automático
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_casos_updated_at on casos_licitacao;
create trigger trg_casos_updated_at
  before update on casos_licitacao
  for each row execute function public.set_updated_at();

drop trigger if exists trg_conhecimento_updated_at on base_conhecimento;
create trigger trg_conhecimento_updated_at
  before update on base_conhecimento
  for each row execute function public.set_updated_at();

drop trigger if exists trg_config_llm_updated_at on configuracoes_llm_usuario;
create trigger trg_config_llm_updated_at
  before update on configuracoes_llm_usuario
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. GRANTS — padrão Supabase: acesso de tabela liberado para as roles
--    da API; a segurança real fica na RLS (que continua ativa para
--    anon/authenticated; service_role tem bypassrls). Sem isto, um banco
--    aplicado só pelas migrations (CLI) nega acesso até ao service_role.
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
