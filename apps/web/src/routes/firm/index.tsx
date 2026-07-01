import { createFileRoute } from "@tanstack/react-router";
import { FirmDashboard } from "../../features/firm/FirmDashboard";

export const Route = createFileRoute("/firm/")({
	component: FirmDashboard,
});
