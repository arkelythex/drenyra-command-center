import { createElement } from "react";
import { Bell, Globe, Mail, ShieldAlert, Zap } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { cn } from "@/lib/utils";
import {
	SettingSwitch,
	SettingsRow,
	SettingsSection,
} from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";

export const NotificationsSettings = () => {
	const [emailEnabled, setEmailEnabled] = useState(true);
	const [pushEnabled, setPushEnabled] = useState(true);
	const [smsEnabled, setSmsEnabled] = useState(false);
	const [criticalOnly, setCriticalOnly] = useState(true);
	const [digestFrequency, setDigestFrequency] = useState("daily");

	return (
		<SettingsShell
			title="Notificaciones"
			description="Calibrá las señales operativas y evitá la fatiga de alertas."
			icon={Bell}
			badge="SEÑALES OPERATIVAS"
		>
			<div className="space-y-10">
				{/* Channel Matrix */}
				<SettingsSection
					title="Canales de distribución"
					description="Activá los canales para recibir señales operativas."
				>
					<div className="grid gap-4 md:grid-cols-3">
						{[
							{
								id: "email",
								label: "Correo electrónico",
								desc: "Resúmenes de auditoría y alertas fiscales.",
								icon: Mail,
								active: emailEnabled,
								setter: setEmailEnabled,
							},
							{
								id: "push",
								label: "Notificaciones push",
								desc: "Eventos operativos en tiempo real.",
								icon: Zap,
								active: pushEnabled,
								setter: setPushEnabled,
							},
							{
								id: "sms",
								label: "SMS",
								desc: "Canal de respaldo para alertas críticas.",
								icon: Globe,
								active: smsEnabled,
								setter: setSmsEnabled,
							},
						].map((channel) => (
							<button
								type="button"
								key={channel.id}
								onClick={() => channel.setter(!channel.active)}
								aria-pressed={channel.active}
								className={cn(
									"group relative flex flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-all duration-300",
									channel.active
										? "border-[var(--accent)]/30 bg-[var(--accent)]/[0.03] shadow-lg"
										: "border-[var(--border-default)] bg-[var(--surface-2)]/30 hover:border-[var(--border-subtle)]",
								)}
							>
								<div
									className={cn(
										"flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors",
										channel.active
											? "border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]"
											: "border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-tertiary)]",
									)}
								>
									{createElement(channel.icon, { size: 18, strokeWidth: 2.5 })}
								</div>
								<div className="space-y-1">
									<p className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">
										{channel.label}
									</p>
									<p className="text-xs font-medium text-[var(--text-secondary)] leading-snug">
										{channel.desc}
									</p>
								</div>
								<div
									className={cn(
										"absolute right-6 top-6 h-1.5 w-1.5 rounded-full transition-all duration-500",
										channel.active
											? "bg-[var(--accent)] shadow-[0_0_10px_var(--accent)]"
											: "bg-[var(--text-tertiary)]/20",
									)}
								/>
							</button>
						))}
					</div>
				</SettingsSection>

				<div className="grid gap-10 lg:grid-cols-[1fr_400px]">
					<div className="space-y-10">
						<SettingsSection
							title="Sensibilidad operativa"
							description="Ajustá volumen y prioridad para mantener señales relevantes."
						>
							<SettingsRow
								title="Resumen operativo"
								description="Resúmenes consolidados para seguimiento ejecutivo."
								action={
									<select
										aria-label="Frecuencia del resumen operativo"
										className="h-9 w-32 rounded-xl border border-[var(--border-default)] bg-[var(--surface-1)] px-3 text-xs font-black uppercase tracking-widest text-[var(--text-primary)]"
										value={digestFrequency}
										onChange={(event) => setDigestFrequency(event.target.value)}
									>
										<option value="realtime">Tiempo real</option>
										<option value="daily">Diaria</option>
										<option value="weekly">Semanal</option>
									</select>
								}
							/>

							<SettingsRow
								title="Prioridad de señales críticas"
								description="Reduce el ruido informativo y prioriza incidentes."
								action={
									<SettingSwitch
										checked={criticalOnly}
										onCheckedChange={setCriticalOnly}
										label="Solo alertas críticas"
										className="ml-auto"
									/>
								}
							/>
						</SettingsSection>
					</div>

					<div className="space-y-6">
						<div className="flex items-center justify-between px-2">
							<span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
								Vista previa de señales
							</span>
							<Bell size={14} className="text-[var(--text-tertiary)]" />
						</div>

						<div className="space-y-3">
							{[
								{
									type: "Informativa",
									msg: "Cierre mensual listo para auditoría.",
									icon: Mail,
									color: "text-[var(--color-info)]",
								},
								{
									type: "Actualización",
									msg: "Nuevo patrón de conciliación bancaria detectado.",
									icon: Zap,
									color: "text-[var(--accent)]",
								},
								{
									type: "Crítica",
									msg: "Inconsistencia con SUNAT detectada en SIRE.",
									icon: ShieldAlert,
									color: "text-[var(--color-danger)]",
								},
							].map((item, idx) => (
								<SurfaceCard
									key={idx}
									variant="muted"
									padding="lg"
									className="group relative flex items-start gap-4 rounded-2xl border-[var(--border-default)] bg-[var(--surface-2)]/30 transition-all hover:bg-[var(--surface-2)]/60"
								>
									<div className={cn("mt-1", item.color)}>
										{createElement(item.icon, { size: 16, strokeWidth: 2.5 })}
									</div>
									<div>
										<StatusBadge
											status={
												item.type === "Crítica"
													? "danger"
													: item.type === "Actualización"
														? "info"
														: "neutral"
											}
											label={item.type}
											className="mb-1"
										/>
										<p className="text-xs font-medium text-[var(--text-secondary)] leading-snug">
											{item.msg}
										</p>
									</div>
								</SurfaceCard>
							))}
						</div>
					</div>
				</div>
			</div>
		</SettingsShell>
	);
};
