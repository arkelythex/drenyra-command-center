"use client";

import { useEffect } from "react";

/**
 * Catches errors in the root layout itself.
 * Without this, a layout error shows Next.js's default error page
 * with no recovery options.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Global application error:", error);
	}, [error]);

	return (
		<html lang="es">
			<body className="font-sans text-base antialiased bg-[#0A0A0A] text-white">
				<main className="min-h-screen flex items-center justify-center px-4">
					<div className="container mx-auto max-w-md text-center">
						<div className="rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12">
							<h1 className="text-6xl font-bold mb-2">500</h1>
							<h2 className="text-xl font-semibold mb-4">
								¡Algo salió mal!
							</h2>
							<p className="text-muted-foreground mb-8 leading-relaxed">
								Ha ocurrido un error inesperado. Nuestro equipo ha sido
								notificado y estamos trabajando para solucionarlo.
							</p>
							<div className="flex flex-col sm:flex-row gap-3 justify-center">
								<button
									onClick={reset}
									className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-opacity hover:opacity-90"
								>
									Intentar de nuevo
								</button>
								<a
									href="/"
									className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
								>
									Volver al inicio
								</a>
							</div>
						</div>
					</div>
				</main>
			</body>
		</html>
	);
}
