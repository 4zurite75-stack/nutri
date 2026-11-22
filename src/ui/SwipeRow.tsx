import { useRef, useState, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

const OPEN = 84;

/** Fila que se desliza a la izquierda para mostrar "Eliminar". */
export function SwipeRow({ children, onDelete, className = '' }: { children: ReactNode; onDelete: () => void; className?: string }) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const g = useRef<{ x0: number; y0: number; base: number; lock: 'h' | 'v' | null } | null>(null);

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    g.current = { x0: e.clientX, y0: e.clientY, base: x, lock: null };
  };
  const move = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s) return;
    const dx = e.clientX - s.x0;
    const dy = e.clientY - s.y0;
    if (!s.lock) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      s.lock = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
      if (s.lock === 'h') {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDragging(true);
      }
    }
    if (s.lock !== 'h') return;
    const nx = Math.min(0, s.base + dx);
    setX(nx < -OPEN ? -OPEN + (nx + OPEN) * 0.5 : nx);
  };
  const up = () => {
    const s = g.current;
    g.current = null;
    if (!s || s.lock !== 'h') return;
    setDragging(false);
    if (x < -OPEN * 2.2) {
      setX(-window.innerWidth);
      setTimeout(onDelete, 180);
    } else setX(x < -OPEN / 2 ? -OPEN : 0);
  };

  return (
    <div className={`swipe ${className}`}>
      <button
        className="swipe__action"
        style={{ width: Math.max(OPEN, -x) }}
        onClick={() => {
          setX(-window.innerWidth);
          setTimeout(onDelete, 180);
        }}
        aria-label="Eliminar"
        tabIndex={x < 0 ? 0 : -1}
      >
        <Trash2 size={20} />
      </button>
      <div
        className="swipe__content"
        style={{ transform: `translateX(${x}px)`, transition: dragging ? 'none' : undefined }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onClickCapture={(e) => {
          if (x !== 0) {
            e.stopPropagation();
            setX(0);
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
