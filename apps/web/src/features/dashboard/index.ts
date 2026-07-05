// Public API for Dashboard Feature
// Feature-Sliced Design

// API
export { analyticsApi } from "./api/analytics.api";
// UI Components
export { DashboardView } from "./components/DashboardView";
export { dashboardKeys } from "./dashboard.query-keys";
export {
	dashboardOverviewQueryOptions,
	dashboardRecentDocumentsQueryOptions,
	dashboardSummaryQueryOptions,
	fiscalIndicatorsQueryOptions,
} from "./dashboard.query-options";

// Hooks
export { useDashboardData } from "./hooks/useDashboardData";
