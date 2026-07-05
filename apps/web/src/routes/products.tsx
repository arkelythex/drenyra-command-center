import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/products")({
	loader: () => {
		throw redirect({ to: "/operaciones/products" });
	},
});
