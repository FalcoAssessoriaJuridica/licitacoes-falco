-- ============================================================
-- DEPLOY FRESCO — Plataforma de Licitações Falco
-- Gerado por scripts/regen-deploy-sql.sh — NÃO editar à mão.
-- Cole INTEIRO no SQL Editor de um projeto Supabase novo/vazio.
-- Depois rode 'npm run seed:conhecimento' com as chaves do projeto.
-- ============================================================

-- >>>>>>>>>> 20260909120000_001_schema_inicial.sql <<<<<<<<<<
-- ============================================================
-- PLATAFORMA DE LICITAÇÕES FALCO — SCHEMA INICIAL (Fase 1)
-- Rodar no SQL Editor do Supabase, ou via `supabase db push`.
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- TENANTS (escritórios) — existe desde o início mesmo com 1 só,
-- para não exigir migração de dados no futuro.
-- ------------------------------------------------------------
create table tenants (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PROFILES — estende auth.users (gerenciado pelo Supabase Auth)
-- com dados próprios da aplicação: a qual tenant o usuário
-- pertence e seu papel.
-- ------------------------------------------------------------
create type papel_usuario as enum ('admin', 'advogado', 'assistente');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  nome text,
  papel papel_usuario not null default 'advogado',
  created_at timestamptz not null default now()
);

-- Cria automaticamente um profile (e um tenant, se for o 1º usuário
-- daquele e-mail) quando alguém se cadastra via Supabase Auth.
-- Simplificado para a Fase 1: cada novo usuário ganha seu próprio
-- tenant. Na Fase 4 (multi-tenant real), isso muda para um fluxo de
-- convite/associação a um tenant existente.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  novo_tenant_id uuid;
begin
  insert into tenants (nome) values (coalesce(new.raw_user_meta_data->>'nome_escritorio', 'Meu Escritório'))
  returning id into novo_tenant_id;

  insert into profiles (id, tenant_id, nome, papel)
  values (new.id, novo_tenant_id, new.raw_user_meta_data->>'nome', 'admin');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- CASOS DE LICITAÇÃO
-- ------------------------------------------------------------
create type fase_caso as enum (
  'impugnacao_edital',
  'recurso_habilitacao',
  'recurso_sancao',
  'mandado_seguranca'
);

create type entidade_contratante as enum (
  'caixa',
  'banco_do_brasil',
  'petrobras',
  'correios',
  'orgao_lei14133',
  'outra'
);

create type status_caso as enum (
  'rascunho',
  'em_revisao',
  'finalizado',
  'protocolado'
);

create table casos_licitacao (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  criado_por uuid not null references profiles(id),
  cliente_nome text not null,
  cliente_cnpj text,
  entidade_contratante entidade_contratante not null,
  entidade_contratante_outra text, -- preenchido quando entidade = 'outra'
  fase fase_caso not null,
  numero_processo text,
  numero_edital text,
  numero_contrato text,
  prazo_limite date,
  status status_caso not null default 'rascunho',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_casos_tenant on casos_licitacao(tenant_id);
create index idx_casos_status on casos_licitacao(tenant_id, status);

-- ------------------------------------------------------------
-- DOCUMENTOS DO CASO (uploads: edital, contrato, notificação...)
-- Os arquivos em si ficam no Supabase Storage; esta tabela guarda
-- os metadados e o texto já extraído (para não reprocessar).
-- ------------------------------------------------------------
create type tipo_documento as enum ('edital', 'contrato', 'notificacao', 'outro');

create table documentos_caso (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos_licitacao(id) on delete cascade,
  tipo tipo_documento not null default 'outro',
  nome_arquivo text not null,
  arquivo_path text not null, -- caminho no bucket do Supabase Storage
  texto_extraido text,
  created_at timestamptz not null default now()
);

create index idx_documentos_caso on documentos_caso(caso_id);

-- ------------------------------------------------------------
-- PEÇAS GERADAS — histórico de versões por caso
-- ------------------------------------------------------------
create table pecas_geradas (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references casos_licitacao(id) on delete cascade,
  versao int not null default 1,
  conteudo text not null,
  provedor_llm text, -- 'anthropic' | 'openai' | 'ollama' | etc — texto livre por simplicidade
  modelo_llm text,
  gerado_por uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_pecas_caso on pecas_geradas(caso_id, versao desc);

-- ------------------------------------------------------------
-- CONFIGURAÇÃO DE LLM POR USUÁRIO
-- api_key_criptografada fica nula quando o provedor é 'ollama'
-- (modelo local não precisa de chave armazenada no servidor).
-- ------------------------------------------------------------
create table configuracoes_llm_usuario (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  provedor text not null default 'anthropic',
  api_key_criptografada text,
  modelo_padrao text,
  ollama_endpoint text default 'http://localhost:11434',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- BASE DE CONHECIMENTO — equivalente aos arquivos /referencias/
-- da skill licitacoes-falco, agora versionável por tenant.
-- ------------------------------------------------------------
create type tipo_conhecimento as enum ('regulamento_entidade', 'doutrina', 'peca_modelo');

create table base_conhecimento (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  tipo tipo_conhecimento not null,
  entidade entidade_contratante, -- null quando não for específico de uma entidade
  titulo text not null,
  conteudo_md text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conhecimento_tenant on base_conhecimento(tenant_id, tipo);

-- ============================================================
-- ROW LEVEL SECURITY — cada tabela de negócio só é visível para
-- usuários do mesmo tenant. Isso é o que torna multi-tenant seguro.
-- ============================================================

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table casos_licitacao enable row level security;
alter table documentos_caso enable row level security;
alter table pecas_geradas enable row level security;
alter table configuracoes_llm_usuario enable row level security;
alter table base_conhecimento enable row level security;

-- Função auxiliar: retorna o tenant_id do usuário autenticado atual
create function public.tenant_id_atual()
returns uuid
language sql
security definer
stable
as $$
  select tenant_id from profiles where id = auth.uid();
$$;

-- tenants: usuário só vê o próprio tenant
create policy "usuario ve seu proprio tenant"
  on tenants for select
  using (id = tenant_id_atual());

-- profiles: usuário vê colegas do mesmo tenant
create policy "usuario ve profiles do mesmo tenant"
  on profiles for select
  using (tenant_id = tenant_id_atual());

create policy "usuario edita seu proprio profile"
  on profiles for update
  using (id = auth.uid());

-- casos_licitacao: CRUD completo restrito ao próprio tenant
create policy "select casos do proprio tenant"
  on casos_licitacao for select
  using (tenant_id = tenant_id_atual());

create policy "insert casos no proprio tenant"
  on casos_licitacao for insert
  with check (tenant_id = tenant_id_atual());

create policy "update casos do proprio tenant"
  on casos_licitacao for update
  using (tenant_id = tenant_id_atual());

create policy "delete casos do proprio tenant"
  on casos_licitacao for delete
  using (tenant_id = tenant_id_atual());

-- documentos_caso: acesso via join implícito (o caso já é filtrado por tenant)
create policy "select documentos de casos do proprio tenant"
  on documentos_caso for select
  using (
    exists (
      select 1 from casos_licitacao c
      where c.id = documentos_caso.caso_id
      and c.tenant_id = tenant_id_atual()
    )
  );

create policy "insert documentos em casos do proprio tenant"
  on documentos_caso for insert
  with check (
    exists (
      select 1 from casos_licitacao c
      where c.id = documentos_caso.caso_id
      and c.tenant_id = tenant_id_atual()
    )
  );

create policy "delete documentos de casos do proprio tenant"
  on documentos_caso for delete
  using (
    exists (
      select 1 from casos_licitacao c
      where c.id = documentos_caso.caso_id
      and c.tenant_id = tenant_id_atual()
    )
  );

-- pecas_geradas: mesma lógica de documentos_caso
create policy "select pecas de casos do proprio tenant"
  on pecas_geradas for select
  using (
    exists (
      select 1 from casos_licitacao c
      where c.id = pecas_geradas.caso_id
      and c.tenant_id = tenant_id_atual()
    )
  );

create policy "insert pecas em casos do proprio tenant"
  on pecas_geradas for insert
  with check (
    exists (
      select 1 from casos_licitacao c
      where c.id = pecas_geradas.caso_id
      and c.tenant_id = tenant_id_atual()
    )
  );

-- configuracoes_llm_usuario: cada usuário só vê/edita a própria
create policy "usuario ve sua propria config de llm"
  on configuracoes_llm_usuario for select
  using (user_id = auth.uid());

create policy "usuario insere sua propria config de llm"
  on configuracoes_llm_usuario for insert
  with check (user_id = auth.uid());

create policy "usuario atualiza sua propria config de llm"
  on configuracoes_llm_usuario for update
  using (user_id = auth.uid());

-- base_conhecimento: leitura para todo o tenant, escrita só por admin
-- (a checagem de papel = 'admin' fica a cargo da aplicação por ora;
-- manter simples na Fase 1)
create policy "select conhecimento do proprio tenant"
  on base_conhecimento for select
  using (tenant_id = tenant_id_atual());

create policy "insert conhecimento no proprio tenant"
  on base_conhecimento for insert
  with check (tenant_id = tenant_id_atual());

create policy "update conhecimento do proprio tenant"
  on base_conhecimento for update
  using (tenant_id = tenant_id_atual());

-- >>>>>>>>>> 20260909120100_002_conhecimento_global_e_geracao.sql <<<<<<<<<<
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

