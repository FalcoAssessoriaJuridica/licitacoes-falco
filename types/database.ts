/**
 * Tipos gerados manualmente a partir de database/001_schema_inicial.sql.
 * Quando o projeto Supabase estiver criado, substituir por:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 *
 * `Relationships: []` em cada tabela é exigido pela tipagem interna do
 * supabase-js (GenericTable) — omiti-lo faz a inferência de `.select()`
 * cair silenciosamente em `never`.
 */

export type PapelUsuario = 'admin' | 'advogado' | 'assistente';

export type FaseCaso =
  | 'impugnacao_edital'
  | 'recurso_habilitacao'
  | 'recurso_sancao'
  | 'mandado_seguranca';

export type EntidadeContratante =
  | 'caixa'
  | 'banco_do_brasil'
  | 'petrobras'
  | 'correios'
  | 'orgao_lei14133'
  | 'outra';

export type StatusCaso = 'rascunho' | 'em_revisao' | 'finalizado' | 'protocolado';

export type TipoDocumento = 'edital' | 'contrato' | 'notificacao' | 'outro';

export type TipoConhecimento = 'regulamento_entidade' | 'doutrina' | 'peca_modelo';

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          nome: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          tenant_id: string;
          nome: string | null;
          papel: PapelUsuario;
          created_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          nome?: string | null;
          papel?: PapelUsuario;
          created_at?: string;
        };
        Update: {
          nome?: string | null;
          papel?: PapelUsuario;
        };
        Relationships: [];
      };
      casos_licitacao: {
        Row: {
          id: string;
          tenant_id: string;
          criado_por: string;
          cliente_nome: string;
          cliente_cnpj: string | null;
          entidade_contratante: EntidadeContratante;
          entidade_contratante_outra: string | null;
          fase: FaseCaso;
          numero_processo: string | null;
          numero_edital: string | null;
          numero_contrato: string | null;
          prazo_limite: string | null;
          status: StatusCaso;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          criado_por: string;
          cliente_nome: string;
          cliente_cnpj?: string | null;
          entidade_contratante: EntidadeContratante;
          entidade_contratante_outra?: string | null;
          fase: FaseCaso;
          numero_processo?: string | null;
          numero_edital?: string | null;
          numero_contrato?: string | null;
          prazo_limite?: string | null;
          status?: StatusCaso;
        };
        Update: {
          cliente_nome?: string;
          cliente_cnpj?: string | null;
          entidade_contratante?: EntidadeContratante;
          entidade_contratante_outra?: string | null;
          fase?: FaseCaso;
          numero_processo?: string | null;
          numero_edital?: string | null;
          numero_contrato?: string | null;
          prazo_limite?: string | null;
          status?: StatusCaso;
          updated_at?: string;
        };
        Relationships: [];
      };
      documentos_caso: {
        Row: {
          id: string;
          caso_id: string;
          tipo: TipoDocumento;
          nome_arquivo: string;
          arquivo_path: string;
          texto_extraido: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          caso_id: string;
          tipo?: TipoDocumento;
          nome_arquivo: string;
          arquivo_path: string;
          texto_extraido?: string | null;
        };
        Update: {
          tipo?: TipoDocumento;
          texto_extraido?: string | null;
        };
        Relationships: [];
      };
      pecas_geradas: {
        Row: {
          id: string;
          caso_id: string;
          versao: number;
          titulo: string | null;
          fase: FaseCaso | null;
          entidade: EntidadeContratante | null;
          conteudo: string;
          prompt_usado: string | null;
          provedor_llm: string | null;
          modelo_llm: string | null;
          tokens_entrada: number | null;
          tokens_saida: number | null;
          gerado_por: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          caso_id: string;
          versao?: number;
          titulo?: string | null;
          fase?: FaseCaso | null;
          entidade?: EntidadeContratante | null;
          conteudo: string;
          prompt_usado?: string | null;
          provedor_llm?: string | null;
          modelo_llm?: string | null;
          tokens_entrada?: number | null;
          tokens_saida?: number | null;
          gerado_por: string;
        };
        Update: {
          conteudo?: string;
          titulo?: string | null;
        };
        Relationships: [];
      };
      configuracoes_llm_usuario: {
        Row: {
          id: string;
          user_id: string;
          provedor: string;
          api_key_criptografada: string | null;
          modelo_padrao: string | null;
          ollama_endpoint: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provedor?: string;
          api_key_criptografada?: string | null;
          modelo_padrao?: string | null;
          ollama_endpoint?: string | null;
        };
        Update: {
          provedor?: string;
          api_key_criptografada?: string | null;
          modelo_padrao?: string | null;
          ollama_endpoint?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      base_conhecimento: {
        Row: {
          id: string;
          tenant_id: string | null;
          tipo: TipoConhecimento;
          entidade: EntidadeContratante | null;
          slug: string | null;
          titulo: string;
          conteudo_md: string;
          fases: FaseCaso[];
          ordem: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          tipo: TipoConhecimento;
          entidade?: EntidadeContratante | null;
          slug?: string | null;
          titulo: string;
          conteudo_md: string;
          fases?: FaseCaso[];
          ordem?: number;
        };
        Update: {
          titulo?: string;
          conteudo_md?: string;
          slug?: string | null;
          fases?: FaseCaso[];
          ordem?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      papel_usuario: PapelUsuario;
      fase_caso: FaseCaso;
      entidade_contratante: EntidadeContratante;
      status_caso: StatusCaso;
      tipo_documento: TipoDocumento;
      tipo_conhecimento: TipoConhecimento;
    };
    CompositeTypes: Record<string, never>;
  };
}
