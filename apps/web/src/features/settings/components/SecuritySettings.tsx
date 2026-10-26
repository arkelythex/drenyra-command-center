import { Shield } from "lucide-react";
import { SettingsShell } from "./SettingsShell";
import { SettingsUnavailable } from "./SettingsUnavailable";

export const SecuritySettings = () => (
	<SettingsShell
		title="Seguridad"
		description="Acceso, sesiones y privacidad de tus datos."
		icon={Shield}
	>
		<SettingsUnavailable title="Aún no está disponible">
			El control de sesiones, la verificación en dos pasos y la privacidad de
			datos todavía no se administran desde aquí.
		</SettingsUnavailable>
	</SettingsShell>
);
