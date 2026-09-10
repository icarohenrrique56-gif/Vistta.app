import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { captureException } from '../services/telemetry';

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
    captureException(error, { module: 'interface', action: 'renderizar_componente', operation: 'react_render', componentStack: info.componentStack });
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
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"><AlertCircle size={24} /></div>
          <h1 className="mb-3 text-xl font-bold text-slate-900">Não foi possível carregar esta tela</h1>
          <p className="mb-6 text-sm leading-6 text-slate-500">O VISTTA protegeu sua sessão para evitar dados incompletos. Recarregue e tente novamente. Se o problema continuar, verifique a conexão com o Firebase.</p>
          <button onClick={this.reload} className="rounded-xl bg-[var(--vistta-plum)] px-5 py-3 font-bold text-white hover:bg-[var(--vistta-violet)]">Recarregar aplicação</button>
        </div>
      </div>
    );
  }
}
