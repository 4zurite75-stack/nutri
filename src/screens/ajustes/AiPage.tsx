import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Page } from '../../ui/Page';
import { setSetting, useSettings, type AiModel } from '../../state/settings';
import { toast } from '../../ui/uiStore';

export function AiPage() {
  const s = useSettings();
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  useEffect(() => setKey(s.apiKey), [s.apiKey]);

  const save = async () => {
    const k = key.trim();
    if (k && !k.startsWith('sk-ant-')) return toast('La clave debe empezar por «sk-ant-»');
    setTesting(true);
    const { aiErrorMessage, testKey } = await import('../../lib/ai');
    try {
      if (k) await testKey(k);
      await setSetting('apiKey', k);
      toast(k ? 'Clave verificada y guardada' : 'Clave eliminada', { tone: 'success' });
    } catch (e) {
      toast(aiErrorMessage(e), { duration: 4500 });
    } finally {
      setTesting(false);
    }
  };

  const model = (m: AiModel, title: string, desc: string) => (
    <button className={`choice ${s.aiModel === m ? 'is-active' : ''}`} onClick={() => void setSetting('aiModel', m)}>
      <span className="choice__title">{title}</span>
      <span className="choice__desc">{desc}</span>
    </button>
  );

  return (
    <Page title="Lectura de etiquetas" back="Ajustes">
      <div className="form" style={{ paddingTop: 8 }}>
        <p className="muted">
          Es opcional. Sin clave, la app funciona igual con código de barras y entrada a mano, y la foto de la etiqueta se muestra para que
          copies los valores. Con clave, una IA (Claude, de Anthropic) rellena la tabla por ti.
        </p>
        <div className="field">
          <span className="field__label">Clave de API de Anthropic</span>
          <div className="key-input">
            <input
              className="input"
              type={show ? 'text' : 'password'}
              value={key}
              placeholder="sk-ant-…"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setKey(e.target.value)}
            />
            <button className="icon-btn icon-btn--muted" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar' : 'Mostrar'}>
              {show ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {s.apiKey && key === s.apiKey && (
            <span className="key-ok">
              <CheckCircle2 size={15} /> Clave guardada en este dispositivo
            </span>
          )}
        </div>
        <button className="btn btn--primary btn--block" disabled={testing || key.trim() === s.apiKey} onClick={() => void save()}>
          {testing ? 'Comprobando…' : key.trim() ? 'Comprobar y guardar' : 'Eliminar clave'}
        </button>
        <div className="field">
          <span className="field__label">Modelo</span>
          <div className="choice-list">
            {model('claude-opus-5-5', 'Claude Opus 5.5 · recomendado', 'El más preciso con fotos torcidas, con reflejos o de mala calidad. ≈ 2–3 céntimos por etiqueta.')}
            {model('claude-haiku-5-5', 'Claude Haiku 5.5 · económico', 'Unas 20 veces más barato, algo menos fiable con fotos difíciles.')}
          </div>
        </div>
      </div>
      <div className="group-title">Cómo conseguir la clave</div>
      <div className="group steps">
        <div className="group__row">1. Entra en console.anthropic.com y crea una cuenta.</div>
        <div className="group__row">2. En «Billing», añade saldo de prepago (el mínimo suele ser 5 $; dura cientos de etiquetas).</div>
        <div className="group__row">3. En «API Keys», pulsa «Create Key», cópiala y pégala aquí.</div>
        <a className="group__row group__row--link" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
          <span>Abrir la consola de Anthropic</span>
          <ExternalLink size={16} className="muted" />
        </a>
      </div>
      <p className="hint group-hint">
        La clave se guarda solo en este iPhone y se envía únicamente a Anthropic. No se incluye en las copias de seguridad. Si sois dos, podéis
        usar la misma clave en ambos teléfonos. Pon un límite de gasto mensual en la consola para estar tranquilos.
      </p>
    </Page>
  );
}
