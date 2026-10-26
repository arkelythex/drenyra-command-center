import { Button } from "@/components/ui/button";

interface RouteErrorProps {
	error: Error;
	reset: () => void;
}

/** Router-level fallback: plain Spanish, a retry, details only on demand. */
export function RouteError({ error, reset }: RouteErrorProps) {
	return (
		<main className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-start justify-center gap-4 px-4 py-10">
			<h1 className="text-xl font-semibold">Algo salió mal</h1>
			<p className="text-sm text-muted-foreground">
				No pudimos mostrar esta pantalla. Puedes reintentar; si el problema
				continúa, avisa a soporte con los detalles técnicos.
			</p>
			<Button
				variant="brand"
				type="button"
				onClick={reset}
				className="h-11 px-5"
			>
				Reintentar
			</Button>
			<details className="w-full text-sm text-muted-foreground">
				<summary className="min-h-11 cursor-pointer py-2">
					Detalles técnicos
				</summary>
				<pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
					{error.message}
				</pre>
			</details>
		</main>
	);
}
