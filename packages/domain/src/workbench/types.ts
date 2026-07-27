/**
 * Workbench Domain Types
 *
 * Framework-free domain types for the workspace hierarchy model.
 * No React, Elysia, or any framework imports allowed here.
 *
 * @module @drenyra/domain/workbench
 */

// ─── Branded Types ─────────────────────────────────────────────────────────

export type WorkspaceId = string & { readonly __brand: "WorkspaceId" };
export type PaneId = string & { readonly __brand: "PaneId" };

// ─── Reference Types ───────────────────────────────────────────────────────

export interface OrganizationRef {
	id: string;
	name: string;
	slug: string;
}

export interface PortfolioRef {
	id: string;
	name: string;
	organizationId: string;
}

export interface CompanyRef {
	id: string;
	name: string;
	ruc: string;
	organizationId: string;
}

export interface PeriodRef {
	year: number;
	month: number; // 1-12
	label: string; // e.g. "Junio 2026"
}

// ─── Intent & Mode Enums ───────────────────────────────────────────────────

export const WORKSPACE_INTENT = {
	CLOSE: "close",
	RECONCILE: "reconcile",
	REVIEW: "review",
	INVESTIGATE: "investigate",
	CONFIGURE: "configure",
	REPORT: "report",
} as const;

export type WorkspaceIntent = (typeof WORKSPACE_INTENT)[keyof typeof WORKSPACE_INTENT];

export const DENSITY_MODE = {
	COMFORTABLE: "comfortable",
	DEFAULT: "default",
	COMPACT: "compact",
} as const;

export type DensityMode = (typeof DENSITY_MODE)[keyof typeof DENSITY_MODE];

// ─── Pane Types ────────────────────────────────────────────────────────────

export const PANE_TYPE = {
	LEDGER: "ledger",
	SIRE_DIFF: "sire-diff",
	EVIDENCE: "evidence",
	AGENT_ACTIVITY: "agent-activity",
	SIAR: "siar",
	APPROVAL: "approval",
	RECONCILIATION: "reconciliation",
	REPORT: "report",
	GENERIC: "generic",
} as const;

export type PaneType = (typeof PANE_TYPE)[keyof typeof PANE_TYPE];

export const PANE_POSITION = {
	LEFT: "left",
	CENTER: "center",
	RIGHT: "right",
} as const;

export type PanePosition = (typeof PANE_POSITION)[keyof typeof PANE_POSITION];

// ─── Pane Config ───────────────────────────────────────────────────────────

export interface PaneConfig {
	id: PaneId;
	type: PaneType;
	label: string;
	position: PanePosition;
	size: number;
	minSize: number;
	metadata?: Record<string, unknown>;
}

// ─── Workspace Layout ──────────────────────────────────────────────────────

export interface WorkspaceLayout {
	panes: PaneConfig[];
	sidebarCollapsed: boolean;
	rightPanelOpen: boolean;
	densityMode: DensityMode;
}

// ─── Workspace ─────────────────────────────────────────────────────────────

export interface Workspace {
	id: WorkspaceId;
	company: CompanyRef;
	period: PeriodRef;
	intent: WorkspaceIntent;
	label: string;
	layout: WorkspaceLayout;
}

// ─── Month Labels ──────────────────────────────────────────────────────────

const MONTH_LABELS: ReadonlyArray<string> = [
	"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
	"Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
] as const;

// ─── Factory Functions ─────────────────────────────────────────────────────

let _workspaceIdCounter = 0;
let _paneIdCounter = 0;

/**
 * Creates a unique WorkspaceId.
 * Uses crypto.randomUUID when available, falls back to a counter-based UUID.
 */
export function createWorkspaceId(): WorkspaceId {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID() as WorkspaceId;
	}
	_workspaceIdCounter += 1;
	return `ws-${Date.now()}-${_workspaceIdCounter}` as WorkspaceId;
}

/**
 * Creates a unique PaneId.
 * Uses crypto.randomUUID when available, falls back to a counter-based UUID.
 */
export function createPaneId(): PaneId {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID() as PaneId;
	}
	_paneIdCounter += 1;
	return `pane-${Date.now()}-${_paneIdCounter}` as PaneId;
}

/**
 * Creates a PeriodRef with validation.
 * @throws {Error} if year is not in range 2020–2100 or month is not 1–12.
 */
export function createPeriodRef(year: number, month: number): PeriodRef {
	if (!Number.isInteger(year) || year < 2020 || year > 2100) {
		throw new Error(`Invalid year: ${year}. Must be an integer between 2020 and 2100.`);
	}
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		throw new Error(`Invalid month: ${month}. Must be an integer between 1 and 12.`);
	}
	const label = `${MONTH_LABELS[month - 1]} ${year}`;
	return { year, month, label };
}

const RUC_PATTERN = /^\d{11}$/;

/**
 * Creates a CompanyRef with RUC validation.
 * @throws {Error} if RUC is not exactly 11 digits.
 */
export function createCompanyRef(
	id: string,
	name: string,
	ruc: string,
	organizationId: string,
): CompanyRef {
	if (!RUC_PATTERN.test(ruc)) {
		throw new Error(
			`Invalid RUC: "${ruc}". Must be exactly 11 digits (0-9).`,
		);
	}
	return { id, name, ruc, organizationId };
}

// ─── Validation ────────────────────────────────────────────────────────────

const VALID_POSITIONS = new Set<string>([PANE_POSITION.LEFT, PANE_POSITION.CENTER, PANE_POSITION.RIGHT]);
const VALID_PANE_TYPES = new Set<string>(Object.values(PANE_TYPE));

/**
 * Validates a pane config object.
 * Returns true if the config has: valid position, valid type, and minSize <= size.
 */
export function validatePaneConfig(config: PaneConfig): boolean {
	if (!VALID_POSITIONS.has(config.position)) return false;
	if (!VALID_PANE_TYPES.has(config.type)) return false;
	if (config.minSize > config.size) return false;
	return true;
}

// ─── Default Layouts ───────────────────────────────────────────────────────

/**
 * Returns the default 3-pane configs: sidebar (260px), main (flex-1), right (420px).
 */
export function defaultPaneConfigs(): PaneConfig[] {
	return [
		{
			id: createPaneId(),
			type: PANE_TYPE.GENERIC,
			label: "Sidebar",
			position: PANE_POSITION.LEFT,
			size: 260,
			minSize: 64,
		},
		{
			id: createPaneId(),
			type: PANE_TYPE.GENERIC,
			label: "Main",
			position: PANE_POSITION.CENTER,
			size: 600,
			minSize: 400,
		},
		{
			id: createPaneId(),
			type: PANE_TYPE.GENERIC,
			label: "Right Panel",
			position: PANE_POSITION.RIGHT,
			size: 420,
			minSize: 300,
		},
	];
}

/**
 * Returns the default WorkspaceLayout.
 */
export function defaultWorkspaceLayout(): WorkspaceLayout {
	return {
		panes: defaultPaneConfigs(),
		sidebarCollapsed: false,
		rightPanelOpen: true,
		densityMode: DENSITY_MODE.DEFAULT,
	};
}
