/**
 * Error Boundary Component for Drenyra
 *
 * Catches React errors and provides graceful degradation.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */

import { AlertTriangle, Bug, Home, RefreshCw } from "lucide-react";
import {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type ErrorInfo,
  Component,
  type ComponentType
} from "react";
import { Button } from "@/components/ui/button";
import { presentError } from "@/lib/error-messages";
import { captureError } from "@/lib/monitoring";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  isolate?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ERROR_STORAGE_KEY = "drenyra-error-log";

/**
 * Log error to local storage for debugging
 */
function logErrorToStorage(error: Error, errorInfo: ErrorInfo) {
	try {
		const existing = localStorage.getItem(ERROR_STORAGE_KEY);
		const logs = existing ? JSON.parse(existing) : [];

		logs.push({
			timestamp: new Date().toISOString(),
			message: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack,
		});

		// Keep only last 10 errors
		const trimmed = logs.slice(-10);
		localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(trimmed));
	} catch {
		return;
	}
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: Error): string {
	return presentError(
		error,
		"Ocurrió un error inesperado. Por favor, intenta de nuevo.",
	).title;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log error for debugging
		logErrorToStorage(error, errorInfo);
		captureError(error, {
			source: "react.error-boundary",
			componentStack: errorInfo.componentStack,
		});

		// Call custom error handler if provided
		this.props.onError?.(error, errorInfo);

		this.setState({
			errorInfo,
		});
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps) {
		// Reset error state when resetKeys change
		if (this.state.hasError && this.props.resetKeys) {
			const hasResetKeyChanged = this.props.resetKeys.some(
				(key, index) => key !== prevProps.resetKeys?.[index],
			);

			if (hasResetKeyChanged) {
				this.reset();
			}
		}
	}

	reset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	handleReload = () => {
		window.location.reload();
	};

	handleGoHome = () => {
		window.location.href = "/";
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
					<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-8 w-8 text-destructive" />
					</div>

					<h2 className="mb-2 text-xl font-bold text-foreground">
						Algo salió mal
					</h2>

					<p className="mb-6 max-w-md text-sm text-muted-foreground">
						{this.state.error
							? getErrorMessage(this.state.error)
							: "Ocurrió un error inesperado."}
					</p>

					<div className="flex flex-wrap gap-3 justify-center">
						<Button
							variant="default"
							size="sm"
							onClick={this.reset}
							className="gap-2"
						>
							<RefreshCw className="h-4 w-4" />
							Reintentar
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={this.handleReload}
							className="gap-2"
						>
							Recargar página
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={this.handleGoHome}
							className="gap-2"
						>
							<Home className="h-4 w-4" />
							Ir al inicio
						</Button>
					</div>

					{/* Development-only debug info */}
					{import.meta.env.DEV && this.state.error && (
						<details className="mt-8 w-full max-w-2xl text-left">
							<summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
								<Bug className="h-4 w-4" />
								Información de debug (desarrollo)
							</summary>
							<pre className="mt-4 max-h-60 overflow-auto rounded-lg bg-muted p-4 text-xs">
								<code>
									{this.state.error.message}
									{"\n\n"}
									{this.state.error.stack}
									{"\n\n"}
									{this.state.errorInfo?.componentStack}
								</code>
							</pre>
						</details>
					)}
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * Hook for functional components to report errors
 */
export function useErrorHandler() {
	const [error, setError] = useState<Error | null>(null);

	const handleError = useCallback((err: Error | string) => {
		const error = typeof err === "string" ? new Error(err) : err;
		setError(error);
		captureError(error, {
			source: "react.use-error-handler",
		});
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	useEffect(() => {
		if (error) {
			throw error;
		}
	}, [error]);

	return { handleError, clearError };
}

/**
 * HOC to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
	Component: ComponentType<P>,
	errorBoundaryProps?: Partial<ErrorBoundaryProps>,
) {
	return function WrappedComponent(props: P) {
		return (
			<ErrorBoundary {...errorBoundaryProps}>
				<Component {...props} />
			</ErrorBoundary>
		);
	};
}
