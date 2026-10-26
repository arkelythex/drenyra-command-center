import { Building2 } from "lucide-react";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { SettingsRow, SettingsSection } from "./SettingsPrimitives";
import { SettingsShell } from "./SettingsShell";
import { SettingsUnavailable } from "./SettingsUnavailable";

export const OrganizationSettings = () => {
	const { companyContext } = useActiveCompanyContext();

	return (
		<SettingsShell
			title="Organización"
			description="La empresa con la que estás trabajando ahora."
			icon={Building2}
		>
			<SettingsSection title="Empresa activa">
				<SettingsRow
					title={companyContext.companyName}
					description={`RUC ${companyContext.ruc}`}
					action={null}
				/>
			</SettingsSection>
			<SettingsUnavailable title="Equipo">
				La gestión de equipo aún no está disponible: no se pueden invitar
				integrantes ni asignar roles desde aquí.
			</SettingsUnavailable>
		</SettingsShell>
	);
};
