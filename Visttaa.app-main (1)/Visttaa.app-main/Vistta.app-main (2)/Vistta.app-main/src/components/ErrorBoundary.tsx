import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Erro inesperado ao renderizar a aplicação.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro de renderização do VISTTA:', error, info.componentStack);
  }

  private reload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4 sm:p-6 text-center">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-lg">
          <h1 className="mb-3 text-xl font-bold text-slate-900">Ocorreu um erro inesperado</h1>
          <p className="mb-6 text-sm text-slate-500">A tela foi protegida para evitar uma falha silenciosa. Recarregue e tente novamente.</p>
          <p className="mb-6 break-words rounded-xl bg-rose-50 p-3 text-left text-xs text-rose-700">{this.state.message}</p>
          <button onClick={this.reload} className="rounded-xl bg-[var(--vistta-plum)] px-5 py-3 font-bold text-white hover:bg-[var(--vistta-violet)]">Recarregar aplicação</button>
        </div>
      </div>
    );
  }
}
