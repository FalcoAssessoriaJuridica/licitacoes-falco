import { useEffect, useState } from 'react';
import { Check, RefreshCw, Plug, KeyRound } from 'lucide-react';
import { getConfigLlm, salvarConfigLlm } from '../services/dados.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { FORMATOS, PRESETS, listarModelos, testarConexao } from '../lib/llm/index.js';

export default function Configuracoes() {
  const { user } = useAuth();
  const { theme, mode, themes, setTheme, setMode } = useTheme();

  const [formato, setFormato] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [modelo, setModelo] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [chaveJaSalva, setChaveJaSalva] = useState(false);

  const [modelos, setModelos] = useState([]);
  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [teste, setTeste] = useState(null);
  const [testando, setTestando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    getConfigLlm(user.id).then((c) => {
      if (!c) return;
      setFormato(c.formato || 'openai');
      setBaseUrl(c.base_url || '');
      setModelo(c.modelo || '');
      setChaveJaSalva(Boolean(c.api_key));
    });
  }, [user.id]);

  function cfgAtual() {
    return {
      formato,
      base_url: baseUrl,
      modelo,
      api_key: apiKey || (chaveJaSalva ? '__manter__' : ''),
    };
  }
  // para chamadas de rede precisamos da chave real; se não digitou nova, buscamos a salva
  async function cfgComChave() {
    if (apiKey) return { formato, base_url: baseUrl, modelo, api_key: apiKey };
    const c = await getConfigLlm(user.id);
    return { formato, base_url: baseUrl, modelo, api_key: c?.api_key || '' };
  }

  function aplicarPreset(p) {
    setBaseUrl(p.base_url);
    if (p.modelo) setModelo(p.modelo);
    setModelos([]);
    setTeste(null);
  }

  async function buscarModelos() {
    setCarregandoModelos(true);
    setModelos(await listarModelos(await cfgComChave()));
    setCarregandoModelos(false);
  }

  async function testar() {
    setTestando(true);
    setTeste(await testarConexao(await cfgComChave()));
    setTestando(false);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    setSalvo(false);
    try {
      await salvarConfigLlm(user.id, {
        formato,
        base_url: baseUrl,
        modelo,
        ...(apiKey ? { api_key: apiKey } : {}),
      });
      if (apiKey) {
        setChaveJaSalva(true);
        setApiKey('');
      }
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch (err) {
      setErro(err.message);
    }
  }

  const presets = PRESETS[formato] || [];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="page-title text-2xl mb-1">Configurações</h1>
        <p className="text-sm text-muted-text">Provedor de IA e aparência.</p>
      </div>

      {/* ---------- PROVEDOR DE IA ---------- */}
      <form onSubmit={salvar} className="card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Plug size={16} className="text-accent" />
          <h2 className="font-serif text-lg text-main">Provedor de IA</h2>
        </div>
        <p className="text-xs text-muted-text -mt-2">
          A geração roda no seu navegador — funciona com API paga, gateway (OpenRouter) ou um
          modelo local / no seu servidor. Nada de chave em servidor nosso.
        </p>

        <div>
          <label className="field-label">Formato</label>
          <select
            className="input"
            value={formato}
            onChange={(e) => {
              setFormato(e.target.value);
              setModelos([]);
              setTeste(null);
            }}
          >
            {FORMATOS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} — {f.sub}
              </option>
            ))}
          </select>
        </div>

        {presets.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                type="button"
                key={p.rotulo}
                onClick={() => aplicarPreset(p)}
                className="btn btn-ghost !py-1 !px-2.5 !text-[11px]"
              >
                {p.rotulo}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="field-label">Base URL</label>
          <input
            className="input mono !text-xs"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://openrouter.ai/api/v1  ·  http://localhost:11434/v1"
          />
        </div>

        <div>
          <label className="field-label flex items-center gap-1.5">
            <KeyRound size={12} /> Chave de API {formato === 'openai' && '(opcional para modelo local)'}
          </label>
          <input
            type="password"
            autoComplete="off"
            className="input mono !text-xs"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={chaveJaSalva ? '•••••••••• salva — preencha só para trocar' : 'cole a chave'}
          />
          <p className="text-[11px] text-dim-text mt-1">
            Guardada na sua linha do banco, protegida por RLS. Para Ollama, rode-o com{' '}
            <code className="mono">OLLAMA_ORIGINS=*</code> para o navegador conseguir chamá-lo.
          </p>
        </div>

        <div>
          <label className="field-label">Modelo</label>
          <div className="flex gap-2">
            {modelos.length > 0 ? (
              <select className="input" value={modelo} onChange={(e) => setModelo(e.target.value)}>
                <option value="">— escolha —</option>
                {modelos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input mono !text-xs"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="gpt-4o · deepseek/deepseek-chat · qwen2.5:14b · claude-sonnet-4-5"
              />
            )}
            <button
              type="button"
              onClick={buscarModelos}
              disabled={carregandoModelos || !baseUrl}
              className="btn btn-ghost shrink-0"
              title="Listar modelos do provedor"
            >
              <RefreshCw size={14} className={carregandoModelos ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {teste && (
          <p
            className={`text-xs card !shadow-none p-2.5 break-words ${
              teste.ok ? 'text-st-ok' : 'text-st-warn'
            }`}
          >
            {teste.msg}
          </p>
        )}
        {erro && <p className="text-xs text-st-warn break-words">{erro}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button type="submit" className="btn btn-primary">
            {salvo ? (
              <>
                <Check size={14} /> Salvo
              </>
            ) : (
              'Salvar'
            )}
          </button>
          <button
            type="button"
            onClick={testar}
            disabled={testando || !baseUrl || !modelo}
            className="btn btn-ghost"
          >
            {testando ? 'Testando…' : 'Testar conexão'}
          </button>
        </div>
      </form>

      {/* ---------- APARÊNCIA ---------- */}
      <div className="card p-6 space-y-4">
        <h2 className="font-serif text-lg text-main">Aparência</h2>
        <div>
          <label className="field-label">Tema</label>
          <div className="grid sm:grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`card !shadow-none p-3 text-left border transition-colors ${
                  t.id === theme ? '!border-accent' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  {t.id === theme && <Check size={13} className="text-accent" />}
                  <span className="text-sm font-medium text-main">{t.nome}</span>
                </span>
                <span className="block text-[11px] text-muted-text mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="field-label">Modo</label>
          <div className="panel inline-flex p-0.5">
            {['dark', 'light'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`btn !py-1.5 !px-4 !text-xs ${mode === m ? 'btn-primary' : 'btn-quiet'}`}
              >
                {m === 'dark' ? 'Escuro' : 'Claro'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
