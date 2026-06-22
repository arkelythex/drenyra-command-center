"use client";

import type { ReactNode } from "react";
import { Component, useCallback } from "react";

interface Props {
  children: ReactNode;
  /** Section name for logging/debugging */
  sectionName: string;
  /** Optional fallback UI — defaults to rendering nothing (graceful degradation) */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary that isolates individual page sections.
 * If one section crashes during hydration or rendering, the rest of the page
 * continues working instead of showing a full-page 500 error.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[SectionErrorBoundary] Section "${this.props.sectionName}" crashed:`,
        error,
        errorInfo,
      );
    }
    // In production, we silently degrade — the section just doesn't render
    // This prevents one broken section from killing the entire page
  }

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it; otherwise render nothing
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

/**
 * Hook to create a stable reset callback for error boundaries.
 * Used internally — not exported for now.
 */
function useResetErrorBoundary() {
  return useCallback(() => {
    // Force re-render by navigating to the same page
    window.location.reload();
  }, []);
}
