import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SettingsShell } from "./SettingsShell";
import { SettingsSection } from "./SettingsPrimitives";
import { SettingsButton } from "./appearance/SettingsUI";
import { OrganizationIdentity, MemberCard } from "./appearance/OrganizationUI";

const TEAM_MEMBERS = [
	{
		name: "Albert Ferrer",
		email: "admin@arkalythix.io",
		role: "Admin",
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
		role: "Viewer",
		status: "Pendiente",
	},
];

export const OrganizationSettings = () => {
	const [companyName] = useState("Drenyra Consulting SAC");
	const [companyRuc] = useState("20123456789");

	return (
		<SettingsShell
			title="Entity Studio"
			description="Define your corporate identity and govern your operational team."
			icon={Building2}
			badge="ORGANIZATION ENGINE"
			actions={
				<SettingsButton variant="primary" size="xs">
					<Plus className="mr-2 h-3.5 w-3.5" />
					Invite Agent
				</SettingsButton>
			}
		>
			<div className="space-y-10">
				<OrganizationIdentity name={companyName} ruc={companyRuc} />

				<div className="grid gap-10 lg:grid-cols-[1fr_400px]">
					<div className="space-y-10">
						<SettingsSection
							title="Team Matrix"
							description="Manage permissions and access levels for your strategic members."
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
							title="Work History"
							description="Recent entity-level changes and audit events."
						>
							<div className="space-y-4">
								{[
									{ event: "Entity Verified", date: "2 hours ago" },
									{ event: "New Seat Added", date: "Jan 15" },
									{ event: "Logo Updated", date: "Dec 22" },
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
								"Organization settings are globally replicated across all
								regional nodes for high-availability compliance."
							</p>
						</SurfaceCard>
					</div>
				</div>
			</div>
		</SettingsShell>
	);
};
