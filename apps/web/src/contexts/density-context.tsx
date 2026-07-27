import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import type { DensityMode } from "@drenyra/domain";
import { DENSITY_MODE } from "@drenyra/domain";

// ─── Storage ──────────────────────────────────────────────────────────────────

const DENSITY_STORAGE_KEY = "drenyra:density-mode";

function readStoredDensity(): DensityMode {
	try {
		const raw = window.localStorage.getItem(DENSITY_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw) as string;
			if (
				parsed === DENSITY_MODE.COMFORTABLE ||
				parsed === DENSITY_MODE.DEFAULT ||
				parsed === DENSITY_MODE.COMPACT
			) {
				return parsed;
			}
		}
	} catch {
		// Corrupted data or localStorage unavailable — fall through to default
	}
	return DENSITY_MODE.DEFAULT;
}

function writeStoredDensity(mode: DensityMode): void {
	try {
		window.localStorage.setItem(DENSITY_STORAGE_KEY, JSON.stringify(mode));
	} catch {
		// localStorage unavailable — silent no-op
	}
}

function applyDensityAttribute(mode: DensityMode): void {
	document.documentElement.setAttribute("data-density", mode);
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface DensityContextValue {
	mode: DensityMode;
	setDensity: (mode: DensityMode) => void;
}

const DensityContext = createContext<DensityContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DensityProvider({ children }: { children: ReactNode }) {
	const [mode, setModeState] = useState<DensityMode>(readStoredDensity);

	// Apply attribute on mount and whenever mode changes
	useEffect(() => {
		applyDensityAttribute(mode);
	}, [mode]);

	const setDensity = useCallback((newMode: DensityMode) => {
		setModeState(newMode);
		writeStoredDensity(newMode);
	}, []);

	return (
		<DensityContext.Provider value={{ mode, setDensity }}>
			{children}
		</DensityContext.Provider>
	);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDensity(): DensityContextValue {
	const ctx = useContext(DensityContext);
	if (!ctx) {
		throw new Error(
			"useDensity must be used within a DensityProvider",
		);
	}
	return ctx;
}
