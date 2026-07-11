import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { MemberCard, OrganizationIdentity } from "./appearance/OrganizationUI";
import { SettingsButton } from "./appearance/SettingsUI";
import { SettingsSection } from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";

const TEAM_MEMBERS = [
	{
		name: "Albert Ferrer",
		email: "admin@arkalythix.io",
		role: "Administrador",
		status: "Activo",
	},
	{
		name: "María Torres",
		email: "contabilidad@arkalythix.io",
		role: "Contador",
		status: "Activo",
	},
	{
		name: "Luis Ramos",
		email: "auditoria@arkalythix.io",
		role: "Revisor",
		status: "Pendiente",
	},
];

export const OrganizationSettings = () => {
	const [companyName] = useState("Drenyra Consulting SAC");
	const [companyRuc] = useState("20123456789");

	return (
		<SettingsShell
			title="Organización"
			description="Definí la identidad corporativa y gestioná el equipo operativo."
			icon={Building2}
			badge="GESTIÓN ORGANIZACIONAL"
			actions={
				<SettingsButton variant="primary" size="xs">
					<Plus className="mr-2 h-3.5 w-3.5" />
					Invitar integrante
				</SettingsButton>
			}
		>
			<div className="space-y-10">
				<OrganizationIdentity name={companyName} ruc={companyRuc} />

				<div className="grid gap-10 lg:grid-cols-[1fr_400px]">
					<div className="space-y-10">
						<SettingsSection
							title="Equipo y accesos"
							description="Gestioná permisos y niveles de acceso del equipo."
						>
							<div className="space-y-3">
								{TEAM_MEMBERS.map((member) => (
									<MemberCard key={member.email} {...member} />
								))}
							</div>
						</SettingsSection>
					</div>

					<div className="space-y-6">
						<SettingsSection
							title="Historial de auditoría"
							description="Cambios recientes de la organización y eventos auditables."
						>
							<div className="space-y-4">
								{[
									{ event: "Organización verificada", date: "hace 2 horas" },
									{ event: "Integrante agregado", date: "15 ene." },
									{ event: "Logotipo actualizado", date: "22 dic." },
								].map((item, idx) => (
									<div
										key={idx}
										className="flex items-center justify-between border-b border-[var(--border-default)] pb-4 last:border-0 last:pb-0"
									>
										<span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
											{item.event}
										</span>
										<StatusBadge status="info" label={item.date} />
									</div>
								))}
							</div>
						</SettingsSection>

						<SurfaceCard
							variant="interactive"
							padding="lg"
							className="rounded-2xl border-[var(--accent)]/10 bg-[var(--accent)]/[0.02]"
						>
							<p className="text-xs leading-relaxed text-[var(--accent)]/60 font-medium italic">
								"La configuración de la organización se replica en todos los
								nodos regionales para preservar disponibilidad y trazabilidad."
							</p>
						</SurfaceCard>
					</div>
				</div>
			</div>
		</SettingsShell>
	);
};
