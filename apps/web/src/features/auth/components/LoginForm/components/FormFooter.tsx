export function FormFooter() {
	return (
		<p className="text-center text-sm text-muted-foreground">
			¿No tienes cuenta?{" "}
			<a
				href="/signup"
				className="inline-flex min-h-11 items-center font-medium text-brand underline-offset-4 hover:underline focus-visible:underline"
			>
				Crear cuenta
			</a>
		</p>
	);
}
