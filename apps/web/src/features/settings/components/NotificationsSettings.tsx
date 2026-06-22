import { useState } from "react";
import { Bell, Mail, ShieldAlert, Zap, Globe } from "lucide-react";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SettingsShell } from "./SettingsShell";
import {
	SettingSwitch,
	SettingsRow,
	SettingsSection,
} from "./SettingsPrimitives";
import { cn } from "@/lib/utils";

export const NotificationsSettings = () => {
	const [emailEnabled, setEmailEnabled] = useState(true);
	const [pushEnabled, setPushEnabled] = useState(true);
	const [smsEnabled, setSmsEnabled] = useState(false);
	const [criticalOnly, setCriticalOnly] = useState(true);
	const [digestFrequency, setDigestFrequency] = useState("daily");

	return (
		<SettingsShell
			title="Signal Intelligence"
			description="Calibrate the flow of operational signals and prevent alert fatigue."
			icon={Bell}
			badge="LEVEL 3 INTEL"
		>
			<div className="space-y-10">
				{/* Channel Matrix */}
				<SettingsSection
					title="Distribution Matrix"
					description="Activate strategic channels for neural signal delivery."
				>
					<div
						className="grid gap-4 md:grid-cols-3"
						role="radiogroup"
						aria-label="Canales de notificación"
					>
						{[
							{
								id: "email",
								label: "Email Ledger",
								desc: "Audit summaries & fiscal alerts.",
								icon: Mail,
								active: emailEnabled,
								setter: setEmailEnabled,
							},
							{
								id: "push",
								label: "Push Pulse",
								desc: "Real-time UI micro-events.",
								icon: Zap,
								active: pushEnabled,
								setter: setPushEnabled,
							},
							{
								id: "sms",
								label: "SMS Matrix",
								desc: "Critical emergency fallback.",
								icon: Globe,
								active: smsEnabled,
								setter: setSmsEnabled,
							},
						].map((channel) => (
							<button
								type="button"
								key={channel.id}
								onClick={() => channel.setter(!channel.active)}
								role="radio"
								aria-checked={channel.active}
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
									<channel.icon size={18} strokeWidth={2.5} />
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
							title="Operational Sensitivity"
							description="Adjust volume and priority to maintain high signal-to-noise ratio."
						>
							<SettingsRow
								title="Intelligence Digest"
								description="Consolidated summaries for executive oversight."
								action={
									<Select
										value={digestFrequency}
										onValueChange={setDigestFrequency}
									>
										<SelectTrigger className="h-9 w-32 rounded-xl bg-[var(--surface-1)] text-xs font-black uppercase tracking-widest">
											<SelectValue placeholder="Frequency" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="realtime">Real-time</SelectItem>
											<SelectItem value="daily">Daily</SelectItem>
											<SelectItem value="weekly">Weekly</SelectItem>
										</SelectContent>
									</Select>
								}
							/>

							<SettingsRow
								title="Critical Signal Priority"
								description="When enabled, suppresses informational noise and prioritizes incidents."
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
								Signal Previews
							</span>
							<Bell size={14} className="text-[var(--text-tertiary)]" />
						</div>

						<div className="space-y-3">
							{[
								{
									type: "Info",
									msg: "Monthly closing ready for audit.",
									icon: Mail,
									color: "text-[var(--info)]",
								},
								{
									type: "Update",
									msg: "New bank matching pattern detected.",
									icon: Zap,
									color: "text-[var(--accent)]",
								},
								{
									type: "Danger",
									msg: "SUNAT mismatch detected in SIRE.",
									icon: ShieldAlert,
									color: "text-[var(--diff-removed)]",
								},
							].map((item, idx) => (
								<SurfaceCard
									key={idx}
									variant="muted"
									padding="lg"
									className="group relative flex items-start gap-4 rounded-2xl border-[var(--border-default)] bg-[var(--surface-2)]/30 transition-all hover:bg-[var(--surface-2)]/60"
								>
									<div className={cn("mt-1", item.color)}>
										<item.icon size={16} strokeWidth={2.5} />
									</div>
									<div>
										<StatusBadge
											status={
												item.type === "Danger"
													? "danger"
													: item.type === "Update"
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
