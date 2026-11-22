import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 'auto' se ajusta al contenido; 'full' ocupa casi toda la pantalla. */
  size?: 'auto' | 'full';
  className?: string;
}

/** Hoja inferior estilo iOS con arrastre para cerrar. */
export function Sheet({ open, onClose, children, size = 'auto', className = '' }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; dy: number; t0: number } | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { y0: e.clientY, dy: 0, t0: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || !panel.current) return;
    const dy = Math.max(0, e.clientY - drag.current.y0);
    drag.current.dy = dy;
    panel.current.style.transition = 'none';
    panel.current.style.transform = `translateY(${dy}px)`;
  };
  const onPointerUp = () => {
    if (!drag.current || !panel.current) return;
    const { dy, t0 } = drag.current;
    const v = dy / Math.max(1, performance.now() - t0);
    drag.current = null;
    panel.current.style.transition = '';
    panel.current.style.transform = '';
    if (dy > 120 || (v > 0.6 && dy > 30)) onClose();
  };

  return createPortal(
    <div className={`sheet-root ${visible ? 'is-open' : ''}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <div ref={panel} className={`sheet sheet--${size} ${className}`} role="dialog" aria-modal="true">
        <div
          className="sheet-grabber"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function SheetHeader({ title, left, right }: { title: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="sheet-header">
      <div className="sheet-header__side">{left}</div>
      <div className="sheet-header__title">{title}</div>
      <div className="sheet-header__side sheet-header__side--right">{right}</div>
    </div>
  );
}
