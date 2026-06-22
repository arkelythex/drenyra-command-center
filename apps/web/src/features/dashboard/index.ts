// Public API for Dashboard Feature
// Feature-Sliced Design

// UI Components
export { DashboardView } from './components/DashboardView';

// API
export { analyticsApi } from './api/analytics.api';
export { dashboardKeys } from './dashboard.query-keys';
export {
  dashboardOverviewQueryOptions,
  dashboardRecentDocumentsQueryOptions,
  dashboardSummaryQueryOptions,
  fiscalIndicatorsQueryOptions,
} from './dashboard.query-options';

// Hooks
export { useDashboardData } from './hooks/useDashboardData';
