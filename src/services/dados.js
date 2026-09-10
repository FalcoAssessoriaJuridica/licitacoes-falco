import { supabase } from './supabase.js';

// ---- perfil / tenant --------------------------------------------------
export async function getPerfil(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, tenant_id, nome, papel')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ---- casos ----------------------------------------------------------------
export async function listarCasos() {
  const { data, error } = await supabase
    .from('casos_licitacao')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getCaso(id) {
  const { data, error } = await supabase
    .from('casos_licitacao')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function criarCaso(userId, payload) {
  const perfil = await getPerfil(userId);
  const { data, error } = await supabase
    .from('casos_licitacao')
    .insert({
      tenant_id: perfil.tenant_id,
      criado_por: userId,
      cliente_nome: payload.cliente_nome,
      cliente_cnpj: payload.cliente_cnpj || null,
      entidade_contratante: payload.entidade_contratante,
      entidade_contratante_outra:
        payload.entidade_contratante === 'outra' ? payload.entidade_contratante_outra || null : null,
      fase: payload.fase,
      numero_processo: payload.numero_processo || null,
      numero_edital: payload.numero_edital || null,
      numero_contrato: payload.numero_contrato || null,
      prazo_limite: payload.prazo_limite || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- peças --------------------------------------------------------------
export async function listarPecas(casoId) {
  const { data, error } = await supabase
    .from('pecas_geradas')
    .select('id, versao, titulo, modelo_llm, provedor_llm, created_at')
    .eq('caso_id', casoId)
    .order('versao', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getPeca(casoId, pecaId) {
  const { data, error } = await supabase
    .from('pecas_geradas')
    .select('*')
    .eq('id', pecaId)
    .eq('caso_id', casoId)
    .single();
  if (error) throw error;
  return data;
}

export async function salvarPeca(userId, casoId, dados) {
  const { data: ultima } = await supabase
    .from('pecas_geradas')
    .select('versao')
    .eq('caso_id', casoId)
    .order('versao', { ascending: false })
    .limit(1)
    .maybeSingle();
  const versao = (ultima?.versao ?? 0) + 1;

  const { data, error } = await supabase
    .from('pecas_geradas')
    .insert({
      caso_id: casoId,
      versao,
      titulo: dados.titulo || `Peça — v${versao}`,
      fase: dados.fase,
      entidade: dados.entidade,
      conteudo: dados.conteudo,
      provedor_llm: dados.provedor_llm || null,
      modelo_llm: dados.modelo_llm || null,
      prompt_usado: dados.prompt_usado || null,
      tokens_entrada: dados.tokens_entrada ?? null,
      tokens_saida: dados.tokens_saida ?? null,
      gerado_por: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---- base de conhecimento -------------------------------------------------
export async function getBaseConhecimento() {
  const { data, error } = await supabase
    .from('base_conhecimento')
    .select('slug, tipo, titulo, conteudo_md, fases, ordem');
  if (error) throw error;
  return data || [];
}

// ---- config de LLM do usuário -----------------------------------------
export async function getConfigLlm(userId) {
  const { data } = await supabase
    .from('configuracoes_llm_usuario')
    .select('formato, base_url, api_key, modelo')
    .eq('user_id', userId)
    .maybeSingle();
  return data || null;
}

export async function salvarConfigLlm(userId, cfg) {
  const payload = {
    user_id: userId,
    provedor: cfg.formato, // coluna legada NOT NULL
    formato: cfg.formato,
    base_url: cfg.base_url || null,
    modelo: cfg.modelo || null,
  };
  if (typeof cfg.api_key === 'string' && cfg.api_key.trim()) {
    payload.api_key = cfg.api_key.trim();
  }
  const { error } = await supabase
    .from('configuracoes_llm_usuario')
    .upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}
