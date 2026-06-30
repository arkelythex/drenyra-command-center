import { createFileRoute } from "@tanstack/react-router";
import { DrenyraFlexMain } from "@/components/agentic/DrenyraFlexMain";

export const Route = createFileRoute("/workspace/")({
	component: DrenyraFlexMain,
});
