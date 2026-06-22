import { Search, Home, ArrowRight, FileQuestion } from "lucide-react";
import Link from "next/link";

export const metadata = {
	title: "Página no encontrada | Arkelythex",
	description: "La página que buscas no existe o ha sido movida.",
};

export default function NotFound() {
	return (
		<main className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground theme-oled">
			<div className="container mx-auto max-w-md">
				<div className="rounded-2xl border border-border/20 bg-secondary/5 p-8 md:p-12 text-center">
					<div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
						<FileQuestion className="w-10 h-10 text-accent" aria-hidden />
					</div>

					<h1 className="text-6xl font-bold text-foreground mb-2">404</h1>

					<h2 className="text-xl font-semibold text-foreground mb-4">
						Página no encontrada
					</h2>

					<p className="text-muted-foreground mb-8 leading-relaxed">
						Lo sentimos, la página que estás buscando no existe o ha sido movida
						a otra ubicación.
					</p>

					<div className="mb-8 text-left">
						<p className="text-sm font-medium text-foreground mb-3">
							¿Quizás buscabas?
						</p>
						<ul className="space-y-2">
							<li>
								<Link
									href="/drenyra"
									className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none rounded"
								>
									<ArrowRight className="w-3 h-3" aria-hidden />
									Drenyra — Workspace fiscal
								</Link>
							</li>
							<li>
								<Link
									href="/precios"
									className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none rounded"
								>
									<ArrowRight className="w-3 h-3" aria-hidden />
									Precios
								</Link>
							</li>
							<li>
								<Link
									href="/api"
									className="text-sm text-muted-foreground hover:text-accent transition-colors flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none rounded"
								>
									<ArrowRight className="w-3 h-3" aria-hidden />
									API Docs
								</Link>
							</li>
						</ul>
					</div>

					<div className="mb-6">
						<form action="/api" method="GET" className="relative">
							<label htmlFor="not-found-doc-search" className="sr-only">
								Ir a API Docs
							</label>
							<input
								id="not-found-doc-search"
								type="search"
								name="q"
								placeholder="Buscar en API Docs..."
								className="w-full px-4 py-3 pl-11 rounded-xl border border-border/20 bg-secondary/5 text-foreground placeholder:text-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-shadow duration-200"
							/>
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" aria-hidden />
						</form>
					</div>

					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Link
							href="/"
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none"
						>
							<Home className="w-4 h-4" aria-hidden />
							Volver al inicio
						</Link>
					</div>

					<div className="mt-8 pt-6 border-t border-border/10">
						<p className="text-xs text-muted-foreground">
							Si crees que esto es un error, por favor{" "}
							<a
								href="mailto:soporte@arkelythexfounders.com"
								className="text-accent hover:underline focus-visible:ring-2 focus-visible:ring-foreground/50 focus-visible:outline-none rounded"
							>
								contáctanos
							</a>
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
