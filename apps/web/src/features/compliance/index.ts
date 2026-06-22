/**
 * Compliance feature public surface.
 *
 * Keep this entrypoint focused on route-safe exports so lazy-loaded tab modules
 * are not pulled into the main feature chunk accidentally.
 */

export { ComplianceView } from './components/ComplianceView';
export { useCompliance } from './hooks/useCompliance';
export { useSireReconciliation } from './hooks/useSireReconciliation';
export type { SireEntry, SireStatus } from './types/sire.types';
