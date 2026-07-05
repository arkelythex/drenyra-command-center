import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import type { JSX } from "react";
import { useEffect } from "react";
import { captureError } from "@/lib/monitoring";

interface DefaultRouteErrorProps {
	error: Error;
}

export function DefaultRouteError({
	error,
}: DefaultRouteErrorProps): JSX.Element {
	useEffect(() => {
		captureError(error, { source: "tanstack-router.default-error" });
	}, [error]);

	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
			<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<AlertTriangle className="h-8 w-8 text-destructive" />
			</div>
			<h2 className="mb-2 text-xl font-bold text-foreground">Algo salió mal</h2>
			<p className="mb-6 max-w-md text-sm text-muted-foreground">
				{error.message.includes("fetch") || error.message.includes("network")
					? "No se pudo conectar con el servidor. Verifica tu conexión a internet."
					: "Ocurrió un error inesperado. Por favor, intenta de nuevo."}
			</p>
			<div className="flex flex-wrap justify-center gap-3">
				<button
					onClick={() => window.location.reload()}
					className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					<RefreshCw className="h-4 w-4" />
					Recargar página
				</button>
				<button
					onClick={() => {
						window.location.href = "/";
					}}
					className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
				>
					<Home className="h-4 w-4" />
					Ir al inicio
				</button>
			</div>
		</div>
	);
}

export function DefaultPendingRoute(): JSX.Element {
	return (
		<div className="flex h-screen w-full flex-col items-center justify-center bg-background">
			<div className="relative">
				<div className="h-12 w-12 animate-spin-slow rounded-2xl border border-primary/20" />
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
				</div>
			</div>
			<p className="mt-4 text-2xs font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">
				Sincronizando Enjambre...
			</p>
		</div>
	);
}
