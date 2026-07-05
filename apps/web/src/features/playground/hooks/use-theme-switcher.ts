"use client";

import { useCallback, useState } from "react";

export const ACCENT_PRESETS = [
	"ember",
	"cocoa",
	"terracotta",
	"teal",
	"steel",
	"sage",
	"lavender",
	"maple",
] as const;

export type AccentPreset = (typeof ACCENT_PRESETS)[number];
export type ThemeMode = "dark" | "light";
export type Density = "compact" | "normal" | "spacious";

function getInitialAccent(): AccentPreset {
	if (typeof document === "undefined") return "ember";
	const attr = document.documentElement.getAttribute("data-accent");
	if (attr && (ACCENT_PRESETS as readonly string[]).includes(attr)) {
		return attr as AccentPreset;
	}
	return "ember";
}

function getInitialMode(): ThemeMode {
	if (typeof document === "undefined") return "dark";
	return document.documentElement.classList.contains("light")
		? "light"
		: "dark";
}

function getInitialDensity(): Density {
	if (typeof document === "undefined") return "normal";
	const attr = document.documentElement.getAttribute("data-density");
	if (attr === "compact" || attr === "spacious") return attr;
	return "normal";
}

export function useThemeSwitcher() {
	const [accent, setAccentState] = useState<AccentPreset>(getInitialAccent);
	const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
	const [density, setDensityState] = useState<Density>(getInitialDensity);

	const setAccent = useCallback((a: string) => {
		if (!(ACCENT_PRESETS as readonly string[]).includes(a)) return;
		document.documentElement.setAttribute("data-accent", a);
		setAccentState(a as AccentPreset);
	}, []);

	const toggleMode = useCallback(() => {
		const isLight = document.documentElement.classList.contains("light");
		if (isLight) {
			document.documentElement.classList.remove("light");
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
			document.documentElement.classList.add("light");
		}
		setModeState(isLight ? "dark" : "light");
	}, []);

	const setDensity = useCallback((d: string) => {
		if (d !== "compact" && d !== "normal" && d !== "spacious") return;
		document.documentElement.setAttribute("data-density", d);
		setDensityState(d as Density);
	}, []);

	return { accent, mode, density, setAccent, toggleMode, setDensity };
}
