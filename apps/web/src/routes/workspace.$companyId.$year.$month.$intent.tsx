import { createFileRoute } from "@tanstack/react-router";
import { MissionWorkspace } from "@/features/workspace/components/MissionWorkspace";

export const Route = createFileRoute(
	"/workspace/$companyId/$year/$month/$intent",
)({
	component: MissionWorkspace,
});
