"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error("[EscuelaInfo ErrorBoundary caught an error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-4 rounded-3xl bg-[var(--rojo-bg)] border border-[var(--rojo-border)] text-[var(--text)] space-y-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2.5 text-[var(--rojo)]">
            <AlertTriangle size={20} strokeWidth={2.5} />
            <h4 className="font-black text-sm uppercase tracking-wider">
              {this.props.fallbackTitle || "Ocurrió un error al cargar este componente"}
            </h4>
          </div>
          <p className="text-xs text-[var(--text2)] leading-relaxed">
            Se produjo un conflicto temporal al inicializar la ventana. Podés reintentar sin perder tu sesión activa.
          </p>
          {this.state.error?.message && (
            <div className="p-3 rounded-xl bg-black/40 text-[11px] font-mono text-[var(--rojo)] border border-[var(--rojo-border)]/50 break-words">
              {this.state.error.message}
            </div>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--rojo)] text-white text-xs font-black hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            <RefreshCw size={14} />
            <span>Reintentar</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
