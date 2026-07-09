/**
 * useTheme — Hook de tema dark/light para el Command Center.
 *
 * Lee `drenyra:settings` de localStorage, aplica la clase `dark` en
 * `<html>` cuando corresponde, y escucha cambios cross-tab via
 * `storage` event.
 *
 * @since Jun 2026
 */

import { useEffect, useSyncExternalStore } from "react";
import type { CommandCenterSettings } from "../components/SettingsPanel";

const STORAGE_KEY = "drenyra:settings";

function getSettings(): CommandCenterSettings | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return null;
		return JSON.parse(stored) as CommandCenterSettings;
	} catch {
		return null;
	}
}

const EVENT_KEY = "drenyra:settings-changed";

function subscribeToSettings(callback: () => void): () => void {
	window.addEventListener("storage", callback);
	window.addEventListener(EVENT_KEY, callback);
	return () => {
		window.removeEventListener("storage", callback);
		window.removeEventListener(EVENT_KEY, callback);
	};
}

/** Dispara en la misma tab para que useTheme reaccione inmediatamente */
export function notifySettingsChanged(): void {
	window.dispatchEvent(new Event(EVENT_KEY));
}

/**
 * Aplica la clase `dark` en <html> según la preferencia del usuario.
 * - `"dark"` → siempre dark
 * - `"system"` → matchMedia prefers-color-scheme: dark
 * - default → dark (fallback seguro para app fiscal)
 */
function applyTheme(settings: CommandCenterSettings | null): void {
	const theme = settings?.theme ?? "dark";
	const isDark =
		theme === "dark" ||
		(theme === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches);

	document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
	const settings = useSyncExternalStore(subscribeToSettings, getSettings);

	// Aplicar al montar y cuando cambia
	useEffect(() => {
		applyTheme(settings);
	}, [settings]);

	// Escuchar cambios del sistema cuando está en modo "system"
	useEffect(() => {
		if (settings?.theme !== "system") return;

		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => applyTheme(settings);
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, [settings]);

	const isDark =
		settings?.theme === "dark" ||
		(settings?.theme === "system" &&
			window.matchMedia("(prefers-color-scheme: dark)").matches) ||
		true;

	return { isDark, theme: settings?.theme ?? "dark" };
}
