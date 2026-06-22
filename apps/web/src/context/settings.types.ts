export type CodexThemeMode = "light" | "dark" | "system";

export interface CodexThemeTokens {
	accent: string;
	surface: string; // Fondo principal
	surfaceLow: string; // Elevación baja (cards, inputs)
	surfaceHigh: string; // Elevación alta (modales, popovers)
	ink: string; // Texto principal
	inkSecondary: string; // Texto de apoyo
	inkTertiary: string; // Texto deshabilitado o decorativo
	border: string; // Bordes estándar
	borderStrong: string; // Bordes de enfoque o destacados
	contrast: number;
	uiFont: string;
	codeFont: string;
	diffAdded: string;
	diffRemoved: string;
	warning: string;
	info: string;
	skill: string;
	opaqueWindows: boolean;
}

export interface CodexThemeSettings {
	version: "codex-theme-v1";
	name: string;
	mode: CodexThemeMode;
	tokens: CodexThemeTokens;
}

export type CodexPetCompanion = "alpaca" | "otter" | "condor";

export interface CodexPetSettings {
	enabled: boolean;
	companion: CodexPetCompanion;
}

export interface AppSettings {
	theme: "system" | "light" | "dark" | "auto";
	bgImage: string | null;
	overlayColor: string | null;
	blur: boolean;
	wallpaperDim: number;
	textureOverlay: boolean;
	codexTheme: CodexThemeSettings;
	codexPets: CodexPetSettings;
	aiAutonomyLevel: number;
	chatStyle: {
		userBubbleColor: string;
		aiBubbleColor: string;
	};
}
