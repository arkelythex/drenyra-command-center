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
			title="Seguridad"
			description="Gestioná accesos, cifrado e integridad de las sesiones."
			icon={Shield}
			badge="CONTROL DE ACCESO"
			actions={
				<SettingsButton variant="secondary" size="xs">
					Registros de auditoría
				</SettingsButton>
			}
		>
			<div className="space-y-10">
				<SecurityHealth score={92} />

				<div className="grid gap-10 lg:grid-cols-[1fr_350px]">
					<div className="space-y-10">
						<SettingsSection
							title="Autenticación y acceso"
							description="Controles esenciales para proteger el acceso del equipo."
						>
							<SettingsRow
								title="Clave maestra"
								description="Última rotación: 12 ene. 2026."
								action={
									<SettingsButton
										variant="secondary"
										size="sm"
										className="ml-auto"
									>
										<KeyRound className="mr-2 h-3.5 w-3.5" />
										Rotar clave
									</SettingsButton>
								}
							/>

							<SettingsRow
								title="2FA obligatorio"
								description="Exigí autenticación de dos factores para administradores."
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
							title="Privacidad de datos"
							description="Controlá cómo los agentes de IA procesan y conservan la información operativa."
						>
							<SettingsRow
								title="Mejora de modelos"
								description="Permití procesar contenido para mejorar modelos base."
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
								title="Memoria de largo plazo"
								description="Conservá el contexto operativo entre sesiones."
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
								Sesiones activas
							</span>
							<StatusBadge status="success" label="ACTIVAS" />
						</div>

						<SurfaceCard
							variant="muted"
							padding="md"
							className="space-y-3 border-[var(--border-default)] bg-[var(--surface-2)]/40"
						>
							<SessionCard
								device="MacBook Pro · Tokyo"
								location="Dispositivo actual"
								isCurrent
							/>
							<SessionCard device="iPhone 15 · Safari" location="Lima, PE" />
							<SessionCard device="Windows 11 · Edge" location="Bogotá, CO" />
						</SurfaceCard>

						<SettingsButton variant="danger" size="sm" className="w-full">
							<ShieldAlert className="mr-2 h-3.5 w-3.5" />
							Cerrar todas las sesiones
						</SettingsButton>
					</div>
				</div>
			</div>
		</SettingsShell>
	);
};
