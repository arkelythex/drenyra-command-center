import type {
	CheckHistoryEntry,
	SystemCheck,
} from "@drenyra/persistence/schema";

const CHECK_CATEGORIES = [
	"database",
	"ai_api",
	"sunat",
	"redis",
	"storage",
	"external",
] as const;

const CHECK_STATUSES = ["healthy", "degraded", "down", "unknown"] as const;

type CheckCategory = (typeof CHECK_CATEGORIES)[number];
type CheckStatus = (typeof CHECK_STATUSES)[number];

interface CheckRunResult {
	status: CheckStatus;
	duration: number;
	error?: string;
}

interface DashboardAggregate {
	total: number;
	healthy: number;
	degraded: number;
	down: number;
	unknown: number;
	uptime: number;
	lastFullRun: string | null;
}

interface CheckDetailResponse extends SystemCheck {
	history: CheckHistoryEntry[];
}

export type {
	CheckCategory,
	CheckDetailResponse,
	CheckRunResult,
	CheckStatus,
	DashboardAggregate,
};

export { CHECK_CATEGORIES, CHECK_STATUSES };
