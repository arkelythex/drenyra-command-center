import { createFileRoute } from "@tanstack/react-router";
import { DrenyraWorkspace } from "@/features/drenyra-command-center/components/DrenyraWorkspace";

export const Route = createFileRoute("/drenyra/")({
	component: DrenyraWorkspace,
});
