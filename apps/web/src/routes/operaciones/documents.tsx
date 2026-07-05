import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { getTenantContext } from "../../lib/api";

export const Route = createFileRoute("/operaciones/documents")({
	loader: async ({ context }) => {
		const { companyId } = getTenantContext();
		if (!companyId) return;

		const { documentsQueryOptions } = await import(
			"../../features/documents/documents.query"
		);

		await context.queryClient.ensureQueryData(documentsQueryOptions(companyId));
	},
	component: lazyRouteComponent(
		() => import("../../features/documents/components/DocumentsView"),
		"DocumentsView",
	),
});
