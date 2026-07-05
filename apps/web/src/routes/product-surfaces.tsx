import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/product-surfaces")({
	loader: () => {
		throw redirect({ to: "/configuracion/product-surfaces" });
	},
});
