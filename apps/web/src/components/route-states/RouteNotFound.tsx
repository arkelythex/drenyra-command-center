import { Link } from "@tanstack/react-router";

/** Router-level fallback for an address that matches no route. */
export function RouteNotFound() {
	return (
		<main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-start justify-center gap-4 px-4 py-10">
			<h1 className="text-xl font-semibold">Página no encontrada</h1>
			<p className="text-sm text-muted-foreground">
				La dirección no existe o fue movida.
			</p>
			<Link
				to="/"
				className="inline-flex h-11 items-center rounded-lg bg-brand px-5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
			>
				Ir al inicio
			</Link>
		</main>
	);
}
