import { KeyRound, Shield, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { SecurityHealth, SessionCard } from "./appearance/SecurityUI";
import { SettingsButton } from "./appearance/SettingsUI";
import {
	SettingSwitch,
	SettingsRow,
	SettingsSection,
} from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";

export const SecuritySettings = () => {
	const [twoFactorRequired, setTwoFactorRequired] = useState(true);
	const [allowModelImprovement, setAllowModelImprovement] = useState(false);
	const [longTermMemory, setLongTermMemory] = useState(true);

	return (
		<SettingsShell
			title="Security Protocol"
			description="Manage access vectors, encryption parameters, and session integrity."
			icon={Shield}
			badge="LEVEL 4 CLEARANCE"
			actions={
				<SettingsButton variant="secondary" size="xs">
					Audit Logs
				</SettingsButton>
			}
		>
			<div className="space-y-10">
				<SecurityHealth score={92} />

				<div className="grid gap-10 lg:grid-cols-[1fr_350px]">
					<div className="space-y-10">
						<SettingsSection
							title="Access Authentication"
							description="Core measures to enforce team operational security."
						>
							<SettingsRow
								title="Master Password"
								description="Last rotation: Jan 12, 2026."
								action={
									<SettingsButton
										variant="secondary"
										size="sm"
										className="ml-auto"
									>
										<KeyRound className="mr-2 h-3.5 w-3.5" />
										Rotate Key
									</SettingsButton>
								}
							/>

							<SettingsRow
								title="Mandatory 2FA"
								description="Enforce two-factor authentication for all administrators."
								action={
									<SettingSwitch
										checked={twoFactorRequired}
										onCheckedChange={setTwoFactorRequired}
										label="2FA obligatorio"
										className="ml-auto"
									/>
								}
							/>
						</SettingsSection>

						<SettingsSection
							title="Neural Data Privacy"
							description="Control how AI agents process and store your operational intelligence."
						>
							<SettingsRow
								title="Intelligence Improvement"
								description="Allow content processing to refine base models."
								action={
									<SettingSwitch
										checked={allowModelImprovement}
										onCheckedChange={setAllowModelImprovement}
										label="Uso de datos"
										className="ml-auto"
									/>
								}
							/>

							<SettingsRow
								title="Long-term Neural Memory"
								description="Persist operational context across multiple sessions."
								action={
									<SettingSwitch
										checked={longTermMemory}
										onCheckedChange={setLongTermMemory}
										label="Memoria"
										className="ml-auto"
									/>
								}
							/>
						</SettingsSection>
					</div>

					<div className="space-y-6">
						<div className="flex items-center justify-between px-2">
							<span className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
								Active Session Matrix
							</span>
							<StatusBadge status="success" label="LIVE" />
						</div>

						<SurfaceCard
							variant="muted"
							padding="md"
							className="space-y-3 border-[var(--border-default)] bg-[var(--surface-2)]/40"
						>
							<SessionCard
								device="MacBook Pro · Tokyo"
								location="Current Device"
								isCurrent
							/>
							<SessionCard device="iPhone 15 · Safari" location="Lima, PE" />
							<SessionCard device="Windows 11 · Edge" location="Bogotá, CO" />
						</SurfaceCard>

						<SettingsButton variant="danger" size="sm" className="w-full">
							<ShieldAlert className="mr-2 h-3.5 w-3.5" />
							Terminate All Sessions
						</SettingsButton>
					</div>
				</div>
			</div>
		</SettingsShell>
	);
};
