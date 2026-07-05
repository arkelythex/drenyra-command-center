export interface CommandCenterSettings {
	defaultDensity: "compact" | "detail" | "numbers-only";
	defaultAgent: string;
	theme: "dark" | "system";
	autoClearOnNewCase: boolean;
	showQuickActionsOnEmpty: boolean;
	maxMessages: number;
}

export interface SettingsPanelProps {
	isOpen: boolean;
	onClose: () => void;
	settings: CommandCenterSettings;
	onSettingsChange: (settings: Partial<CommandCenterSettings>) => void;
}
