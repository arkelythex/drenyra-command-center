import { X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { changeLanguage } from "../../i18n/i18n";
import { RadioGroup } from "./components/RadioGroup";
import { Select } from "./components/Select";
import { Toggle } from "./components/Toggle";
import {
	AGENT_OPTIONS,
	DENSITY_OPTIONS,
	MAX_MESSAGES_OPTIONS,
	STORAGE_KEY,
} from "./SettingsPanel.data";
import type { CommandCenterSettings } from "./SettingsPanel.types";

export interface SettingsPanelProps {
	isOpen: boolean;
	onClose: () => void;
	settings: CommandCenterSettings;
	onSettingsChange: (settings: Partial<CommandCenterSettings>) => void;
}

export function SettingsPanel({
	isOpen,
	onClose,
	settings,
	onSettingsChange,
}: SettingsPanelProps) {
	useEffect(() => {
		if (!isOpen) return;
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved) as Partial<CommandCenterSettings>;
				onSettingsChange(parsed);
			} catch {
				/* ignore invalid saved settings */
			}
		}
	}, [isOpen]);

	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	}, [settings]);

	const update = useCallback(
		(patch: Partial<CommandCenterSettings>) => onSettingsChange(patch),
		[onSettingsChange],
	);

	return (
		<aside
			className={cn(
				"absolute right-0 top-0 z-50 h-full w-80 border-l border-[var(--border-subtle)] bg-[var(--surface-1)]/98  transition-all duration-300 ease-in-out",
				isOpen
					? "translate-x-0 opacity-100"
					: "translate-x-full opacity-0 pointer-events-none",
			)}
			aria-hidden={!isOpen}
		>
			<div className="flex h-full flex-col">
				<div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
					<h2 className="text-sm font-bold text-[var(--text-primary)]">
						Configuración
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
						aria-label="Cerrar configuración"
					>
						<X size={16} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto px-5 py-5">
					<div className="space-y-7">
						<section>
							<h3 className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
								Apariencia
							</h3>
							<div className="space-y-4">
								<div>
									<span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
										Densidad
									</span>
									<RadioGroup
										value={settings.defaultDensity}
										options={DENSITY_OPTIONS}
										onChange={(v) =>
											update({
												defaultDensity:
													v as CommandCenterSettings["defaultDensity"],
											})
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-[var(--text-secondary)]">
										Tema
									</span>
									<div className="flex overflow-hidden rounded-lg border border-[var(--border-subtle)]">
										<button
											type="button"
											onClick={() => update({ theme: "dark" })}
											className={cn(
												"px-3 py-1.5 text-2xs font-medium transition-all",
												settings.theme === "dark"
													? "bg-[var(--surface-3)] text-[var(--text-primary)]"
													: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
											)}
										>
											Dark
										</button>
										<button
											type="button"
											onClick={() => update({ theme: "system" })}
											className={cn(
												"border-l border-[var(--border-subtle)] px-3 py-1.5 text-2xs font-medium transition-all",
												settings.theme === "system"
													? "bg-[var(--surface-3)] text-[var(--text-primary)]"
													: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
											)}
										>
											System
										</button>
									</div>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-xs font-medium text-[var(--text-secondary)]">
										Idioma / Language
									</span>
									<div className="flex overflow-hidden rounded-lg border border-[var(--border-subtle)]">
										<button
											type="button"
											onClick={() => changeLanguage("es")}
											className={cn(
												"px-3 py-1.5 text-2xs font-medium transition-all",
												"border-r border-[var(--border-subtle)]",
											)}
										>
											ES
										</button>
										<button
											type="button"
											onClick={() => changeLanguage("en")}
											className={cn(
												"px-3 py-1.5 text-2xs font-medium transition-all",
											)}
										>
											EN
										</button>
									</div>
								</div>
							</div>
						</section>

						<section>
							<h3 className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
								Comportamiento
							</h3>
							<div className="space-y-4">
								<div>
									<span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
										Agente por defecto
									</span>
									<Select
										value={settings.defaultAgent}
										options={AGENT_OPTIONS}
										onChange={(v) => update({ defaultAgent: v })}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div>
										<span className="text-xs font-medium text-[var(--text-secondary)]">
											Auto-clear al nuevo caso
										</span>
										<p className="text-2xs text-[var(--text-tertiary)]">
											Limpia el chat al abrir un caso
										</p>
									</div>
									<Toggle
										value={settings.autoClearOnNewCase}
										onChange={(v) => update({ autoClearOnNewCase: v })}
									/>
								</div>
								<div className="flex items-center justify-between">
									<div>
										<span className="text-xs font-medium text-[var(--text-secondary)]">
											Quick actions en vacío
										</span>
										<p className="text-2xs text-[var(--text-tertiary)]">
											Muestra acciones rápidas sin mensajes
										</p>
									</div>
									<Toggle
										value={settings.showQuickActionsOnEmpty}
										onChange={(v) => update({ showQuickActionsOnEmpty: v })}
									/>
								</div>
							</div>
						</section>

						<section>
							<h3 className="mb-3 text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
								Historial
							</h3>
							<div>
								<span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
									Máximo de mensajes
								</span>
								<div className="flex overflow-hidden rounded-lg border border-[var(--border-subtle)]">
									{MAX_MESSAGES_OPTIONS.map((opt, i) => (
										<button
											key={opt}
											type="button"
											onClick={() => update({ maxMessages: opt })}
											className={cn(
												"flex-1 px-3 py-1.5 text-2xs font-medium transition-all",
												i > 0 && "border-l border-[var(--border-subtle)]",
												settings.maxMessages === opt
													? "bg-[var(--surface-3)] text-[var(--text-primary)]"
													: "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
											)}
										>
											{opt}
										</button>
									))}
								</div>
							</div>
						</section>
					</div>
				</div>
			</div>
		</aside>
	);
}
