import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { ElderCaneLogo } from './ElderCaneLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[CUIDA ErrorBoundary] Erro capturado:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearSession = () => {
    try {
      localStorage.removeItem('cuida_session_user');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center selection:bg-blue-600">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="inline-flex items-center justify-center p-4 bg-blue-600/20 rounded-2xl border border-blue-500/30">
              <ElderCaneLogo size="lg" variant="white-on-blue" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                <span>Recuperação do Sistema CUIDA</span>
              </h1>
              <p className="text-xs text-slate-400">
                Ocorreu uma oscilação na interface. Seus dados estão seguros e gravados no servidor.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar Interface</span>
              </button>

              <button
                onClick={this.handleClearSession}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reiniciar Sessão de Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
