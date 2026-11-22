import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUI, type ActionSheetReq, type DialogReq } from './uiStore';

function useDelayedUnmount<T>(value: T | null, ms = 260): [T | null, boolean] {
  const [kept, setKept] = useState<T | null>(value);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (value) {
      setKept(value);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setKept(null), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return [kept, visible];
}

function ActionSheetView() {
  const req = useUI((s) => s.actionSheet);
  const [kept, visible] = useDelayedUnmount<ActionSheetReq>(req);
  if (!kept) return null;
  const close = () => useUI.setState({ actionSheet: null });
  return (
    <div className={`as-root ${visible ? 'is-open' : ''}`}>
      <div className="sheet-backdrop" onClick={close} />
      <div className="as-panel">
        <div className="as-group">
          {(kept.title || kept.message) && (
            <div className="as-head">
              {kept.title && <div className="as-title">{kept.title}</div>}
              {kept.message && <div className="as-message">{kept.message}</div>}
            </div>
          )}
          {kept.actions.map((a, i) => (
            <button
              key={i}
              className={`as-btn ${a.destructive ? 'is-destructive' : ''} ${a.selected ? 'is-selected' : ''}`}
              onClick={() => {
                close();
                a.onSelect();
              }}
            >
              {a.icon && <span className="as-icon">{a.icon}</span>}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
        <button className="as-btn as-cancel" onClick={close}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function DialogView() {
  const req = useUI((s) => s.dialog);
  const [kept, visible] = useDelayedUnmount<DialogReq>(req, 200);
  if (!kept) return null;
  const done = (v: 'confirm' | 'cancel' | 'alt') => {
    useUI.setState({ dialog: null });
    kept.resolve(v);
  };
  return (
    <div className={`dlg-root ${visible ? 'is-open' : ''}`}>
      <div className="dlg-backdrop" />
      <div className="dlg" role="alertdialog">
        <div className="dlg-body">
          <div className="dlg-title">{kept.title}</div>
          {kept.message && <div className="dlg-message">{kept.message}</div>}
        </div>
        <div className={`dlg-actions ${kept.altText ? 'is-stacked' : ''}`}>
          <button className="dlg-btn" onClick={() => done('cancel')}>
            {kept.cancelText ?? 'Cancelar'}
          </button>
          {kept.altText && (
            <button className="dlg-btn is-destructive" onClick={() => done('alt')}>
              {kept.altText}
            </button>
          )}
          <button className={`dlg-btn is-bold ${kept.destructive ? 'is-destructive' : ''}`} onClick={() => done('confirm')}>
            {kept.confirmText ?? 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone ?? 'default'} ${t.action ? 'has-action' : ''}`}>
          {t.icon}
          <span>{t.text}</span>
          {t.action && (
            <button
              className="toast__action"
              onClick={() => {
                t.action!.onClick();
                useUI.setState((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) }));
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function Overlays() {
  return createPortal(
    <>
      <ActionSheetView />
      <DialogView />
      <Toasts />
    </>,
    document.body,
  );
}
