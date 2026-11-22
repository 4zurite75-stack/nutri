import { useRef, type ReactNode } from 'react';
import { useNav, type Tab } from './nav';

/** Franja invisible en el borde izquierdo: deslizar hacia la derecha vuelve atrás (como en iOS). */
function EdgeSwipe({ screen }: { screen: React.RefObject<HTMLDivElement | null> }) {
  const g = useRef<{ x0: number; t0: number; dx: number } | null>(null);
  const prev = () => screen.current?.previousElementSibling as HTMLElement | null;

  const move = (dx: number) => {
    const el = screen.current;
    if (!el) return;
    const w = el.offsetWidth;
    const f = Math.max(0, Math.min(1, dx / w));
    el.style.transition = 'none';
    el.style.transform = `translateX(${dx}px)`;
    const p = prev();
    if (p) {
      p.style.transition = 'none';
      p.style.transform = `translateX(${-28 * (1 - f)}%)`;
      p.style.filter = `brightness(${0.55 + 0.45 * f})`;
    }
  };
  const reset = (animate: boolean) => {
    const el = screen.current;
    const p = prev();
    for (const x of [el, p]) {
      if (!x) continue;
      x.style.transition = animate ? '' : 'none';
      x.style.transform = '';
      x.style.filter = '';
    }
  };

  return (
    <div
      className="edge-swipe"
      onPointerDown={(e) => {
        g.current = { x0: e.clientX, t0: performance.now(), dx: 0 };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!g.current) return;
        g.current.dx = Math.max(0, e.clientX - g.current.x0);
        move(g.current.dx);
      }}
      onPointerUp={() => {
        const s = g.current;
        g.current = null;
        if (!s) return;
        const w = screen.current?.offsetWidth ?? 390;
        const v = s.dx / Math.max(1, performance.now() - s.t0);
        if (s.dx > w * 0.35 || (v > 0.5 && s.dx > 40)) {
          const p = prev();
          if (p) {
            // Termina la animación de la pantalla de debajo y luego devuelve el control al CSS.
            p.style.transition = '';
            p.style.transform = 'translateX(0)';
            p.style.filter = 'brightness(1)';
            setTimeout(() => {
              p.style.transform = '';
              p.style.filter = '';
            }, 450);
          }
          if (screen.current) screen.current.style.transition = '';
          useNav.getState().pop();
        } else reset(true);
      }}
      onPointerCancel={() => {
        g.current = null;
        reset(true);
      }}
    />
  );
}

function Pushed({ leaving, covered, isTop, children }: { leaving?: boolean; covered: boolean; isTop: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className={`stack-screen is-pushed ${leaving ? 'is-leaving' : ''} ${covered ? 'is-covered' : ''}`}>
      {children}
      {isTop && !leaving && <EdgeSwipe screen={ref} />}
    </div>
  );
}

export function TabView({ tab, root }: { tab: Tab; root: ReactNode }) {
  const active = useNav((s) => s.tab === tab);
  const stack = useNav((s) => s.stacks[tab]);
  const live = stack.filter((e) => !e.leaving);
  const topKey = live.length ? live[live.length - 1].key : null;
  return (
    <section className={`tabview ${active ? 'is-active' : ''}`} aria-hidden={!active}>
      <div className={`stack-screen is-root ${live.length > 0 ? 'is-covered' : ''}`}>{root}</div>
      {stack.map((e) => {
        const covered = !e.leaving && topKey !== null && e.key !== topKey;
        return (
          <Pushed key={e.key} leaving={e.leaving} covered={covered} isTop={e.key === topKey}>
            {e.render()}
          </Pushed>
        );
      })}
    </section>
  );
}
