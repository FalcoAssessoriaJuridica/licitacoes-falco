/**
 * Semeia a tabela `base_conhecimento` com as linhas GLOBAIS (tenant_id nulo)
 * migradas da skill `licitacoes-falco`.
 *
 * Uso:
 *   node scripts/seed-base-conhecimento.mjs
 *
 * Lê de:  ~/.claude/skills/licitacoes-falco/referencias/**
 * Exige (em .env.local ou no ambiente):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (bypassa RLS — só para este script)
 *
 * Estratégia: apaga as linhas globais com os slugs conhecidos e reinsere.
 * Idempotente. Não toca em linhas de nenhum tenant.
 *
 * MANTER slugs 00..05 EM SINCRONIA com lib/prompts/montar.ts
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile('.env.local');
} catch {
  /* sem .env.local — assume variáveis já no ambiente */
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE_KEY) {
  console.error(
    'Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY (.env.local).'
  );
  process.exit(1);
}

const BASE = join(
  homedir(),
  '.claude/skills/licitacoes-falco/referencias'
);

/** @type {{slug:string, arquivo:string, tipo:string, entidade:string|null, titulo:string, fases:string[], ordem:number}[]} */
const DEFINICOES = [
  {
    slug: '00-mestre-comparativo-regimes',
    arquivo: '00-MESTRE-comparativo-regimes.md',
    tipo: 'regulamento_entidade',
    entidade: null,
    titulo: 'Quadro comparativo — regimes de licitação, sanção e recurso',
    fases: [],
    ordem: 0,
  },
  {
    slug: '01-regulamento-caixa',
    arquivo: '01-regulamento-caixa.md',
    tipo: 'regulamento_entidade',
    entidade: 'caixa',
    titulo: 'Regulamento de Licitações e Contratos da CAIXA (RLC-CAIXA)',
    fases: [],
    ordem: 10,
  },
  {
    slug: '02-regulamento-bb',
    arquivo: '02-regulamento-bb.md',
    tipo: 'regulamento_entidade',
    entidade: 'banco_do_brasil',
    titulo: 'Regulamento de Licitações e Contratos do Banco do Brasil (RLBB)',
    fases: [],
    ordem: 11,
  },
  {
    slug: '03-regulamento-petrobras',
    arquivo: '03-regulamento-petrobras.md',
    tipo: 'regulamento_entidade',
    entidade: 'petrobras',
    titulo: 'Regulamento de Licitações e Contratos da Petrobras (RLCP)',
    fases: [],
    ordem: 12,
  },
  {
    slug: '04-regulamento-correios',
    arquivo: '04-regulamento-correios.md',
    tipo: 'regulamento_entidade',
    entidade: 'correios',
    titulo:
      'Regulamento de Licitações e Contratações dos Correios (RLCC) — ATENÇÃO item 14.5',
    fases: [],
    ordem: 13,
  },
  {
    slug: '05-orgao-lei14133',
    arquivo: '05-orgao-autarquia-fundacao-lei14133.md',
    tipo: 'regulamento_entidade',
    entidade: 'orgao_lei14133',
    titulo: 'Órgão / autarquia / fundação — Lei 14.133/2021 pura',
    fases: [],
    ordem: 14,
  },
  {
    slug: 'doutrina-pre-qualificacao-impugnacao',
    arquivo: 'doutrina/pre-qualificacao-impugnacao.md',
    tipo: 'doutrina',
    entidade: null,
    titulo: 'Doutrina — pré-qualificação e impugnação de edital',
    fases: ['impugnacao_edital'],
    ordem: 20,
  },
  {
    slug: 'doutrina-habilitacao-desclassificacao',
    arquivo: 'doutrina/habilitacao-desclassificacao.md',
    tipo: 'doutrina',
    entidade: null,
    titulo: 'Doutrina — habilitação e desclassificação',
    fases: ['recurso_habilitacao'],
    ordem: 21,
  },
  {
    slug: 'doutrina-certidoes-e-regularidade',
    arquivo: 'doutrina/certidoes-e-regularidade.md',
    tipo: 'doutrina',
    entidade: null,
    titulo: 'Doutrina — certidões e regularidade fiscal/trabalhista (CPD-EN)',
    fases: ['recurso_habilitacao'],
    ordem: 22,
  },
  {
    slug: 'doutrina-sancoes-dosimetria',
    arquivo: 'doutrina/sancoes-dosimetria.md',
    tipo: 'doutrina',
    entidade: null,
    titulo: 'Doutrina — sanções e dosimetria',
    fases: ['recurso_sancao'],
    ordem: 23,
  },
  {
    slug: 'doutrina-mandado-seguranca-licitacao',
    arquivo: 'doutrina/mandado-seguranca-licitacao.md',
    tipo: 'doutrina',
    entidade: null,
    titulo: 'Doutrina — mandado de segurança em licitação',
    fases: ['mandado_seguranca'],
    ordem: 24,
  },
];

const supabase = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const linhas = DEFINICOES.map((d) => {
  let conteudo;
  try {
    conteudo = readFileSync(join(BASE, d.arquivo), 'utf8').trim();
  } catch {
    console.error(`  ! não encontrei ${d.arquivo} em ${BASE}`);
    process.exit(1);
  }
  return {
    tenant_id: null,
    tipo: d.tipo,
    entidade: d.entidade,
    slug: d.slug,
    titulo: d.titulo,
    conteudo_md: conteudo,
    fases: d.fases,
    ordem: d.ordem,
  };
});

const slugs = linhas.map((l) => l.slug);

const del = await supabase
  .from('base_conhecimento')
  .delete()
  .is('tenant_id', null)
  .in('slug', slugs);
if (del.error) {
  console.error('Falha ao limpar linhas globais:', del.error.message);
  process.exit(1);
}

const ins = await supabase.from('base_conhecimento').insert(linhas).select('slug');
if (ins.error) {
  console.error('Falha ao inserir:', ins.error.message);
  process.exit(1);
}

console.log(`OK — ${ins.data.length} linhas globais semeadas:`);
for (const r of ins.data) console.log('  -', r.slug);
