import { useState, type ReactNode, type UIEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { pop } from '../nav/nav';

interface PageProps {
  title: string;
  /** Título grande estilo iOS en la raíz de cada pestaña. */
  large?: boolean;
  back?: string | boolean;
  onBack?: () => void;
  right?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Contenido fijo bajo la cabecera (buscador, filtros…). */
  sub?: ReactNode;
}

export function Page({ title, large, back, onBack, right, children, className = '', sub }: PageProps) {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    const s = y > (large ? 34 : 4);
    if (s !== scrolled) setScrolled(s);
  };
  const showSmallTitle = !large || scrolled;
  return (
    <div className={`page ${className}`}>
      <header className={`navbar ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="navbar__row">
          <div className="navbar__side">
            {back && (
              <button className="navbar__back" onClick={onBack ?? pop}>
                <ChevronLeft size={28} strokeWidth={2.4} />
                <span>{typeof back === 'string' ? back : 'Atrás'}</span>
              </button>
            )}
          </div>
          <div className={`navbar__title ${showSmallTitle ? 'is-visible' : ''}`}>{title}</div>
          <div className="navbar__side navbar__side--right">{right}</div>
        </div>
        {sub && <div className="navbar__sub">{sub}</div>}
      </header>
      <div className={`page__scroll ${sub ? 'has-sub' : ''}`} onScroll={onScroll}>
        {large && <h1 className="large-title">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
