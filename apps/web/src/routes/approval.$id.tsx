import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { z } from "zod";

const paramsSchema = z.object({
	id: z.string().min(1, "Recommendation ID is required"),
});

export const Route = createFileRoute("/approval/$id")({
	parseParams: (params) => paramsSchema.parse(params),
	component: lazyRouteComponent(
		() => import("../features/approval-hub/ApprovalDetailPage"),
		"ApprovalDetailPageWrapper",
	),
});
