"use client";

import { Keyboard } from "lucide-react";
import {
	type KeyboardShortcut,
	useKeyboardShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import { SettingsRow, SettingsSection } from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";

function formatShortcut(shortcut: KeyboardShortcut): string {
	const parts: string[] = [];
	if (shortcut.ctrl) parts.push("Ctrl");
	if (shortcut.shift) parts.push("Shift");
	if (shortcut.alt) parts.push("Alt");
	if (shortcut.meta) parts.push("Cmd");
	parts.push(shortcut.key.toUpperCase());
	return parts.join(" + ");
}

export function KeyboardPage() {
	const { getAllShortcuts, getShortcutsByCategory } = useKeyboardShortcuts();
	const shortcuts = getAllShortcuts();
	const categories = [...new Set(shortcuts.map((s) => s.category))];

	return (
		<SettingsShell
			title="Atajos de Teclado"
			description="Personaliza los atajos de teclado para acelerar tu trabajo"
			icon={Keyboard}
		>
			{categories.length === 0 ? (
				<p className="text-sm text-[var(--text-secondary)]">
					No hay atajos registrados actualmente.
				</p>
			) : (
				<div className="space-y-10">
					{categories.map((category) => {
						const categoryShortcuts = getShortcutsByCategory(category);
						if (categoryShortcuts.length === 0) return null;

						return (
							<SettingsSection key={category} title={category}>
								{categoryShortcuts.map((shortcut, index) => (
									<SettingsRow
										key={index}
										title={shortcut.description}
										action={
											<span className="font-mono text-xs tracking-wide text-[var(--text-primary)]">
												{formatShortcut(shortcut)}
											</span>
										}
									/>
								))}
							</SettingsSection>
						);
					})}
				</div>
			)}
		</SettingsShell>
	);
}
