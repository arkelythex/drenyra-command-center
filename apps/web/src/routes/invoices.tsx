import { createFileRoute } from "@tanstack/react-router";
import { InvoicesBoard } from "@/features/invoices";

export const Route = createFileRoute("/invoices")({
	component: InvoicesBoard,
});
