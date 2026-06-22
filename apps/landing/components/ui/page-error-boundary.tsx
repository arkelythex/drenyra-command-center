"use client";

import type { ReactNode } from "react";
import { Component } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  pageName: string;
}

interface State {
  hasError: boolean;
}

/**
 * Page-level error boundary for product pages.
 * If the client component crashes, shows a styled error page
 * with recovery options instead of the generic 500 page.
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[PageErrorBoundary] Page "${this.props.pageName}" crashed:`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground theme-oled">
          <div className="container mx-auto max-w-md text-center">
            <div className="rounded-2xl border border-border/20 bg-secondary/5 p-8 md:p-12">
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-5xl font-bold text-foreground mb-2">500</h1>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Error en esta página
              </h2>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                Ha ocurrido un error al cargar esta sección. Las demás partes del
                sitio funcionan correctamente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reintentar
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-secondary/20 px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary/35"
                >
                  <Home className="w-4 h-4" />
                  Inicio
                </Link>
              </div>
            </div>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
