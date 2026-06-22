import { Palette, Monitor, Moon, Sun, Zap } from "lucide-react";
import { THEME_ID, THEME_PREFERENCE } from "@/lib/ux-mode";
import type { CodexPetCompanion } from "@/context/settings.types";

export const THEME_PRESETS = [
	{
		id: THEME_ID.LIGHT,
		label: "Light",
		description: "White surface, beige canvas, cocoa ink, lucuma accent.",
		icon: Sun,
		accent: "#c47f30",
		surface: "#F5EFE8",
		ink: "#1B1511",
		mode: "light",
	},
	{
		id: THEME_PREFERENCE.SYSTEM,
		label: "Auto Sync",
		description: "Follows OS circadian rhythm.",
		icon: Monitor,
		accent: "#c47f30",
		surface: "linear-gradient(135deg,#F5EFE8,#0f0f12)",
		ink: "#e0e0e5",
		mode: "system",
	},
	{
		id: THEME_ID.MONO_DARK,
		label: "Dark",
		description: "Monocromatic glass & blur for long sessions.",
		icon: Moon,
		accent: "#e0e0e5",
		surface: "#050505",
		ink: "#ffffff",
		mode: "dark",
	},
];

export const CODEX_PETS: Array<{
	id: CodexPetCompanion;
	name: string;
	emoji: string;
	description: string;
	specialty: string;
}> = [
	{
		id: "alpaca",
		name: "Alpaca Fiscal",
		emoji: "🦙",
		description: "Deep audit assistance.",
		specialty: "Fiscal Accuracy",
	},
	{
		id: "otter",
		name: "Nutria Builder",
		emoji: "🦦",
		description: "UI & Flow optimization.",
		specialty: "UX Engineering",
	},
	{
		id: "condor",
		name: "Cóndor Auditor",
		emoji: "🦅",
		description: "System-wide surveillance.",
		specialty: "Traceability",
	},
];

export const FONT_PRESETS = [
	{ label: "Jakarta", value: "Plus Jakarta Sans" },
	{ label: "Inter", value: "Inter" },
	{ label: "Outfit", value: "Outfit" },
	{ label: "Geist", value: "Geist" },
] as const;

export const CODE_FONT_PRESETS = [
	{ label: "JetBrains", value: "JetBrains Mono" },
	{ label: "Fira Code", value: "Fira Code" },
	{ label: "Plex Mono", value: "IBM Plex Mono" },
] as const;

export const CHAT_THEMES = [
	{
		id: "corporate",
		label: "Executive",
		user: "bg-primary text-primary-foreground",
		ai: "bg-muted text-foreground",
	},
	{
		id: "tactical",
		label: "Tactical",
		user: "bg-[var(--accent)] text-black",
		ai: "bg-surface-3 border border-white/5",
	},
];
