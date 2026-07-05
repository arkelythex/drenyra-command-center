import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/debit-notes")({
	loader: () => {
		throw redirect({ to: "/facturacion/debit-notes" });
	},
});
