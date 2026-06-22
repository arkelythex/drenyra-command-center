import {
	DEMO_COMPANY_ID,
	DEMO_COMPANY_NAME,
	DEMO_COMPANY_RUC,
} from "@/lib/company-context";
import type { Session, User } from "../types/auth.types";

export interface DemoAccessState {
	enabled: true;
	companyId: string;
	companyName: string;
	ruc: string;
	countryCode: string;
	taxRegime: string;
	completedAt: string;
}

export const DEMO_ACCESS_STORAGE_KEY = "arkelythex-demo-access";

function isStorageAvailable(): boolean {
	return typeof localStorage !== "undefined";
}

export function readDemoAccess(): DemoAccessState | null {
	if (!isStorageAvailable()) return null;

	try {
		const raw = localStorage.getItem(DEMO_ACCESS_STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<DemoAccessState>;

		if (
			parsed.enabled !== true ||
			typeof parsed.companyId !== "string" ||
			typeof parsed.companyName !== "string" ||
			typeof parsed.ruc !== "string" ||
			typeof parsed.countryCode !== "string" ||
			typeof parsed.taxRegime !== "string" ||
			typeof parsed.completedAt !== "string"
		) {
			return null;
		}

		return parsed as DemoAccessState;
	} catch {
		return null;
	}
}

export function enableDemoAccess(input?: {
	companyName?: string;
	ruc?: string;
	taxRegime?: string;
}): DemoAccessState {
	const demoAccess: DemoAccessState = {
		enabled: true,
		companyId: DEMO_COMPANY_ID,
		companyName: input?.companyName?.trim() || DEMO_COMPANY_NAME,
		ruc: input?.ruc?.trim() || DEMO_COMPANY_RUC,
		countryCode: "pe",
		taxRegime: input?.taxRegime?.trim() || "RMT",
		completedAt: new Date().toISOString(),
	};

	if (isStorageAvailable()) {
		localStorage.setItem(DEMO_ACCESS_STORAGE_KEY, JSON.stringify(demoAccess));
	}

	return demoAccess;
}

export function clearDemoAccess(): void {
	if (!isStorageAvailable()) return;
	localStorage.removeItem(DEMO_ACCESS_STORAGE_KEY);
}

export function buildDemoSessionPayload(
	demoAccess: DemoAccessState,
): { user: User; session: Session } {
	return {
		user: {
			id: "demo-user",
			email: "demo@arkalythix.local",
			name: "Demo ProInnóvate",
			emailVerified: true,
			role: "ADMIN",
			companyId: demoAccess.companyId,
			companyName: demoAccess.companyName,
			ruc: demoAccess.ruc,
			countryCode: demoAccess.countryCode,
			taxRegime: demoAccess.taxRegime,
		},
		session: {
			id: "demo-session",
			userId: "demo-user",
			expiresAt: new Date("2026-12-31T23:59:59.000Z"),
			token: "demo-session-token",
			ipAddress: "127.0.0.1",
			userAgent: "arkelythex-demo-access",
		},
	};
}
