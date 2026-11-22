import { useEffect, useState } from 'react';
import { Sheet, SheetHeader } from './Sheet';

export function PromptSheet({
  open,
  title,
  placeholder,
  initial = '',
  confirmText = 'Guardar',
  inputMode,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  placeholder?: string;
  initial?: string;
  confirmText?: string;
  inputMode?: 'text' | 'decimal' | 'numeric';
  onClose: () => void;
  onSubmit: (v: string) => void;
}) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    if (open) setV(initial);
  }, [open, initial]);
  const submit = () => {
    if (!v.trim()) return;
    onSubmit(v.trim());
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose}>
      <SheetHeader
        title={title}
        left={
          <button className="link-btn" onClick={onClose}>
            Cancelar
          </button>
        }
        right={
          <button className="link-btn is-bold" disabled={!v.trim()} onClick={submit}>
            {confirmText}
          </button>
        }
      />
      <div className="form" style={{ paddingBottom: 24 }}>
        <input
          className="input"
          autoFocus
          inputMode={inputMode}
          value={v}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          enterKeyHint="done"
        />
      </div>
    </Sheet>
  );
}
