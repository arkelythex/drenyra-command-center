import { createElement } from "react";
import { ChevronDown, Monitor, Moon, Sun, Type } from "lucide-react";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";
import { CodeDiffPreview } from "./appearance/CodeDiffPreview";
import { SettingsRow, SettingsSection } from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";

export const AppearanceSettings = () => {
	const { settings, updateSettings } = useSettings();

	return (
		<SettingsShell
			title="Apariencia"
			description="Personalizá tu entorno visual."
			icon={Sun}
		>
			<div className="space-y-12 max-w-2xl">
				{/* --- THEME SECTION --- */}
				<SettingsSection
					title="Tema"
					description="Elegí Light Pearl, Black OLED o sincronizá el tema con tu sistema."
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center p-1 rounded-xl bg-[var(--surface-2)]/50 border border-[var(--border-subtle)]">
							{[
								{ id: "light" as const, icon: Sun, label: "Light Pearl" },
								{ id: "dark" as const, icon: Moon, label: "Black OLED" },
								{ id: "system" as const, icon: Monitor, label: "Sistema" },
							].map((t) => (
								<button
									type="button"
									key={t.id}
									onClick={() => updateSettings({ theme: t.id })}
									aria-pressed={settings.theme === t.id}
									className={cn(
										"flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
										settings.theme === t.id
											? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm"
											: "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
									)}
								>
									{createElement(t.icon, { size: 14, strokeWidth: 2 })}
									{t.label}
								</button>
							))}
						</div>
					</div>

					<CodeDiffPreview />
				</SettingsSection>

				{/* --- CUSTOMIZATION SECTION --- */}
				<SettingsSection title="Personalización" className="pt-1">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-bold text-[var(--text-primary)]">
							{settings.theme === "dark"
								? "Black OLED"
								: settings.theme === "system"
									? "Tema del sistema"
									: "Light Pearl"}
						</h3>
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2 rounded-xl border border-[var(--border-default)] px-3 py-1.5">
								<Type size={14} className="text-[var(--color-primary)]" />
								<span className="text-xs font-semibold text-[var(--text-primary)]">
									Ledger OS v1
								</span>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<SettingsRow
							title="Acento"
							action={
								<div className="flex items-center gap-3">
									<button
										type="button"
										aria-label="Acento Copper de Drenyra"
										className="h-6 w-16 rounded-lg bg-[var(--color-primary)] border border-[var(--border-subtle)] shadow-inner"
									/>
									<span className="font-mono text-xs font-medium text-[var(--text-secondary)] uppercase">
										var(--color-primary)
									</span>
								</div>
							}
						/>

						<SettingsRow
							title="Fondo"
							action={
								<div className="flex items-center gap-3">
									<button
										type="button"
										aria-label="Background color: white"
										className="h-6 w-6 rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] shadow-sm"
									/>
									<span className="font-mono text-xs font-medium text-[var(--text-secondary)] uppercase">
										#FFFFFF
									</span>
								</div>
							}
						/>

						<SettingsRow
							title="Texto principal"
							action={
								<div className="flex items-center gap-3">
									<button
										type="button"
										aria-label="Foreground color: #0D0D0D"
										className="h-6 w-16 rounded-full bg-[var(--text-primary)] border border-[var(--border-subtle)] shadow-inner"
									/>
									<span className="font-mono text-xs font-medium text-[var(--text-secondary)] uppercase">
										#0D0D0D
									</span>
								</div>
							}
						/>

						<SettingsRow
							title="Tipografía de interfaz"
							action={
								<span className="text-xs font-medium text-[var(--text-primary)]">
									Geist, Inter
								</span>
							}
						/>

						<SettingsRow
							title="Tipografía numérica"
							action={
								<span className="text-xs font-medium text-[var(--text-primary)]">
									"Geist Mono", ui-mono
								</span>
							}
						/>

						<SettingsRow
							title="Barra lateral translúcida"
							action={
								<div className="h-5 w-9 rounded-full bg-[var(--surface-2)] relative p-0.5 transition-colors">
									<div className="h-4 w-4 rounded-full bg-[var(--bg-surface)] shadow-sm" />
								</div>
							}
						/>

						<SettingsRow
							title="Contraste"
							action={
								<div className="flex items-center gap-4 w-48">
									<div className="h-1 flex-1 bg-[var(--surface-2)] rounded-full relative">
										<div className="absolute top-0 left-0 h-full w-[40%] bg-[var(--color-info)] rounded-full" />
										<div className="absolute top-1/2 left-[40%] -translate-y-1/2 h-4 w-4 rounded-full bg-[var(--text-primary)] shadow-lg border border-[var(--bg-surface)] cursor-pointer" />
									</div>
									<span className="min-w-[2ch] font-mono text-xs font-medium text-[var(--text-primary)]">
										40
									</span>
								</div>
							}
						/>
					</div>
				</SettingsSection>

				{/* --- INTERACTION SECTION --- */}
				<SettingsSection title="Interacción" className="pt-1">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<h3 className="text-sm font-bold text-[var(--text-primary)]">
								Usar cursor de puntero
							</h3>
							<p className="text-xs text-[var(--text-secondary)]">
								Muestra un cursor de puntero sobre elementos interactivos.
							</p>
						</div>
						<div className="h-5 w-9 rounded-full bg-[var(--surface-2)] relative p-0.5">
							<div className="h-4 w-4 rounded-full bg-[var(--bg-surface)] shadow-sm" />
						</div>
					</div>

					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<h3 className="text-sm font-bold text-[var(--text-primary)]">
									Tamaño de interfaz
								</h3>
								<p className="text-xs text-[var(--text-secondary)]">
									Ajustá el tamaño base de la interfaz de Drenyra.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<div className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] min-w-[40px] text-center">
									16
								</div>
								<span className="text-xs text-[var(--text-secondary)]">px</span>
							</div>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<h3 className="text-sm font-bold text-[var(--text-primary)]">
									Tamaño numérico
								</h3>
								<p className="text-xs text-[var(--text-secondary)]">
									Ajustá el tamaño para montos, códigos y diffs.
								</p>
							</div>
							<div className="flex items-center gap-2">
								<div className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-bold text-[var(--text-primary)] min-w-[40px] text-center">
									13
								</div>
								<span className="text-xs text-[var(--text-secondary)]">px</span>
							</div>
						</div>
					</div>
				</SettingsSection>

				{/* --- PETS SECTION --- */}
				<SettingsSection title="Asistente" className="pt-1">
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-bold text-[var(--text-primary)]">
							Compañero
						</h3>
						<SurfaceCard
							variant="interactive"
							padding="md"
							className="flex items-center justify-between px-4 py-3 rounded-xl border-[var(--border-default)] group"
						>
							<span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
								Seleccionar compañero
							</span>
							<ChevronDown size={16} className="text-[var(--text-secondary)]" />
						</SurfaceCard>
					</div>
				</SettingsSection>
			</div>
		</SettingsShell>
	);
};
