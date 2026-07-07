/**
 * Shared test constants for cross-feature integration tests.
 *
 * Uses deterministic UUIDs (v4‑style but with fixed patterns for reproducibility).
 * Grouped by feature to make test setup readable at a glance.
 *
 * @module features/shared/__tests__/integration
 */

// ── Generic helpers ───────────────────────────────────────────────────────────
export function orgId(n: number): string {
	return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

// ── Organization (integer PK) ─────────────────────────────────────────────────
export const TEST_ORG_ID = 1;

// ── Users ─────────────────────────────────────────────────────────────────────
export const TEST_OWNER_ID = "00000000-0000-0000-0000-000000000001";
export const TEST_ACCOUNTANT_ID = "00000000-0000-0000-0000-000000000002";
export const TEST_AUDITOR_ID = "00000000-0000-0000-0000-000000000003";

// ── Companies ─────────────────────────────────────────────────────────────────
export const TEST_COMPANY_ID = "00000000-0000-0000-0000-000000000010";

// ── Evidence ──────────────────────────────────────────────────────────────────
export const TEST_EVIDENCE_ID = "00000000-0000-0000-0000-000000000020";
export const TEST_EVIDENCE_HASH =
	"a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";

// ── Accounting PR ─────────────────────────────────────────────────────────────
export const TEST_PR_ID = "00000000-0000-0000-0000-000000000030";

// ── Monthly Close ─────────────────────────────────────────────────────────────
export const TEST_CHECKLIST_ID = "00000000-0000-0000-0000-000000000040";
export const TEST_CHECKLIST_ITEM_ID = "00000000-0000-0000-0000-000000000041";
export const TEST_CLOSE_GATE_ID = "00000000-0000-0000-0000-000000000042";

// ── Judgment Day ──────────────────────────────────────────────────────────────
export const TEST_FINDING_ID = "00000000-0000-0000-0000-000000000050";
export const TEST_INVESTIGATION_ID = "00000000-0000-0000-0000-000000000051";

// ── SIRE ──────────────────────────────────────────────────────────────────────
export const TEST_SIRE_SUBMISSION_ID = "00000000-0000-0000-0000-000000000060";
export const TEST_SIRE_DIFF_ID = "00000000-0000-0000-0000-000000000061";
export const TEST_DISCREPANCY_ID = "00000000-0000-0000-0000-000000000062";

// ── Automation Studio ─────────────────────────────────────────────────────────
export const TEST_WORKFLOW_ID = "00000000-0000-0000-0000-000000000070";
export const TEST_STEP_A_ID = "00000000-0000-0000-0000-000000000071";
export const TEST_STEP_B_ID = "00000000-0000-0000-0000-000000000072";
export const TEST_EXECUTION_ID = "00000000-0000-0000-0000-000000000073";

// ── CFO Analytics ─────────────────────────────────────────────────────────────
export const TEST_DASHBOARD_ID = "00000000-0000-0000-0000-000000000080";
export const TEST_WIDGET_ID = "00000000-0000-0000-0000-000000000081";
export const TEST_REPORT_ID = "00000000-0000-0000-0000-000000000082";
