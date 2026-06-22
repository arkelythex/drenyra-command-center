"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Application error:", error);
	}, [error]);

	return (
		<main className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground theme-oled">
			<div className="container mx-auto max-w-md">
				<div className="rounded-2xl border border-border/20 bg-secondary/5 p-8 md:p-12 text-center">
					<div className="w-20 h-20 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-6">
						<AlertTriangle aria-hidden className="w-10 h-10 text-red-400" />
					</div>

					<h1 className="text-6xl font-bold text-foreground mb-2">500</h1>

					<h2 className="text-xl font-semibold text-foreground mb-4">
						¡Algo salió mal!
					</h2>

					<p className="text-muted-foreground mb-8 leading-relaxed">
						Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y
						estamos trabajando para solucionarlo.
					</p>

					{process.env.NODE_ENV === "development" && (
						<div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
							<p className="text-xs font-mono text-red-400 mb-2">
								Error details:
							</p>
							<p className="text-xs font-mono text-red-300 break-all">
								{error.message}
							</p>
						</div>
					)}

					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<button
							onClick={reset}
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
						>
							<RefreshCw aria-hidden className="w-4 h-4" />
							Intentar de nuevo
						</button>
						<Link
							href="/"
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-secondary/20 px-6 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary/35"
						>
							<Home aria-hidden className="w-4 h-4" />
							Volver al inicio
						</Link>
					</div>

					<button
						onClick={() => window.history.back()}
						className="mt-6 text-sm text-muted-foreground hover:text-accent transition-colors inline-flex items-center gap-1"
					>
						<ArrowLeft aria-hidden className="w-4 h-4" />
						Volver atrás
					</button>

					<div className="mt-8 pt-6 border-t border-border/10">
						<p className="text-xs text-muted-foreground">
							¿Necesitas ayuda?{" "}
							<a
								href="mailto:soporte@arkelythexfounders.com"
								className="text-accent hover:underline"
							>
								Contacta a soporte
							</a>
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
