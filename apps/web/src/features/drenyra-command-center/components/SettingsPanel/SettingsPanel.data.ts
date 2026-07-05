import { DRENYRA_AGENTS } from "@/lib/agents";
import type { CommandCenterSettings } from "./SettingsPanel.types";

export const STORAGE_KEY = "drenyra:settings";

export const DEFAULT_SETTINGS: CommandCenterSettings = {
	defaultDensity: "detail",
	defaultAgent: "sire",
	theme: "dark",
	autoClearOnNewCase: false,
	showQuickActionsOnEmpty: true,
	maxMessages: 100,
};

export const AGENT_OPTIONS = DRENYRA_AGENTS.map((a) => ({
	value: a.id,
	label: a.label,
}));

export const DENSITY_OPTIONS = [
	{ value: "compact", label: "Compacto" },
	{ value: "detail", label: "Detalle" },
	{ value: "numbers-only", label: "Solo números" },
] as const;

export const MAX_MESSAGES_OPTIONS = [50, 100, 200, 500] as const;
