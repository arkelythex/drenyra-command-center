import { create } from "zustand";
import type { HubArtifact } from "@arkelythex/shared/artifacts";
import type { HubViewMode } from "@arkelythex/shared/agents";

const FISCAL_CASE_STORAGE_KEY = "arkelythex.hub.fiscalCase.v1";

function readFiscalCaseFromSession(): {
	fiscalCaseId: string | null;
	fiscalCaseLabel: string | null;
} {
	if (typeof sessionStorage === "undefined") {
		return { fiscalCaseId: null, fiscalCaseLabel: null };
	}
	try {
		const raw = sessionStorage.getItem(FISCAL_CASE_STORAGE_KEY);
		if (!raw) return { fiscalCaseId: null, fiscalCaseLabel: null };
		const parsed = JSON.parse(raw) as {
			id?: string | null;
			label?: string | null;
		};
		return {
			fiscalCaseId: typeof parsed.id === "string" ? parsed.id : null,
			fiscalCaseLabel: typeof parsed.label === "string" ? parsed.label : null,
		};
	} catch {
		return { fiscalCaseId: null, fiscalCaseLabel: null };
	}
}

function writeFiscalCaseToSession(
	id: string | null,
	label: string | null,
): void {
	if (typeof sessionStorage === "undefined") return;
	if (!id && !label) {
		sessionStorage.removeItem(FISCAL_CASE_STORAGE_KEY);
		return;
	}
	sessionStorage.setItem(
		FISCAL_CASE_STORAGE_KEY,
		JSON.stringify({ id, label }),
	);
}

export type HubDensity = "compact" | "normal";

interface UserPreferences {
	favoriteMetrics: string[];
	riskTolerance: "low" | "medium" | "high";
	automationLevel: number;
}

interface HubState {
	mode: HubViewMode;
	density: HubDensity;
	preferences: UserPreferences;
	activeArtifact: HubArtifact | null;
	query: string;
	isAuditMode: boolean;
	showHistory: boolean;
	/** Persistent fiscal expedient (Fiscal Threads) — re-entry across reloads when set. */
	fiscalCaseId: string | null;
	fiscalCaseLabel: string | null;
	setMode: (mode: HubViewMode) => void;
	setDensity: (density: HubDensity) => void;
	setShowHistory: (visible: boolean) => void;
	setPreferences: (prefs: Partial<UserPreferences>) => void;
	setActiveArtifact: (artifact: HubArtifact | null) => void;
	setQuery: (query: string) => void;
	setAuditMode: (enabled: boolean) => void;
	toggleHistory: () => void;
	setFiscalCase: (id: string | null, label: string | null) => void;
	clearFiscalCase: () => void;
	hydrateFiscalCaseFromSession: () => void;
}

export const useHubState = create<HubState>((set) => ({
	mode: "commands",
	density: "normal",
	preferences: {
		favoriteMetrics: ["liquidez", "igv"],
		riskTolerance: "medium",
		automationLevel: 50,
	},
	activeArtifact: null,
	query: "",
	isAuditMode: false,
	showHistory: false,
	fiscalCaseId: null,
	fiscalCaseLabel: null,
	setMode: (mode) => set({ mode }),
	setDensity: (density) => set({ density }),
	setShowHistory: (showHistory) => set({ showHistory }),
	setPreferences: (prefs) =>
		set((state) => ({
			preferences: { ...state.preferences, ...prefs },
		})),
	setActiveArtifact: (activeArtifact) => set({ activeArtifact }),
	setQuery: (query) => set({ query }),
	setAuditMode: (isAuditMode) => set({ isAuditMode }),
	toggleHistory: () => set((state) => ({ showHistory: !state.showHistory })),
	setFiscalCase: (fiscalCaseId, fiscalCaseLabel) => {
		writeFiscalCaseToSession(fiscalCaseId, fiscalCaseLabel);
		set({ fiscalCaseId, fiscalCaseLabel });
	},
	clearFiscalCase: () => {
		writeFiscalCaseToSession(null, null);
		set({ fiscalCaseId: null, fiscalCaseLabel: null });
	},
	hydrateFiscalCaseFromSession: () => {
		set(readFiscalCaseFromSession());
	},
}));
