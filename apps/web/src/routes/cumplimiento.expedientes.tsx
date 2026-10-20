import { createFileRoute } from "@tanstack/react-router";
import { SireDashboard } from "@/features/compliance/components/SireDashboard";

export const Route = createFileRoute("/cumplimiento/expedientes")({
	component: SireDashboard,
});
