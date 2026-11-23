import { Component, type ReactNode } from 'react';

/** Si una pantalla falla, muestra un aviso en lugar de dejar la app en negro. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error('Error en pantalla', error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <b>Algo ha fallado en esta pantalla</b>
        <p className="muted">Tus datos están a salvo. Vuelve atrás o recarga la app.</p>
        <small className="muted">{this.state.error.message}</small>
        <button className="btn btn--tinted" onClick={() => this.setState({ error: null })}>
          Reintentar
        </button>
        <button className="btn btn--primary" onClick={() => location.reload()}>
          Recargar
        </button>
      </div>
    );
  }
}
