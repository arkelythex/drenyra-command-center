import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

/**
 * Accounting Inbox — command center home page.
 * Shows critical tasks, Drenyra suggestions, active agents, and company summaries.
 *
 * Providers (FiscalInspector, etc.) están en AppProviders global.
 */
export const Route = createFileRoute("/")({
	component: lazyRouteComponent(
		() => import("../features/accounting-inbox/AccountingInbox"),
		"AccountingInbox",
	),
});
