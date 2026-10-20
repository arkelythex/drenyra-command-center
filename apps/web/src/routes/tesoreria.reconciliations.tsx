import { createFileRoute } from "@tanstack/react-router";
import { ReconciliationView } from "@/features/reconciliations";

export const Route = createFileRoute("/tesoreria/reconciliations")({
	component: ReconciliationView,
});
