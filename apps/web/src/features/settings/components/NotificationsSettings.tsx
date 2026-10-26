import { Bell } from "lucide-react";
import { SettingsShell } from "./SettingsShell";
import { SettingsUnavailable } from "./SettingsUnavailable";

export const NotificationsSettings = () => (
	<SettingsShell
		title="Notificaciones"
		description="Canales y prioridad de los avisos operativos."
		icon={Bell}
	>
		<SettingsUnavailable title="Aún no está disponible">
			Todavía no enviamos avisos por correo, push ni SMS, así que no hay nada
			que configurar. Te avisaremos cuando exista.
		</SettingsUnavailable>
	</SettingsShell>
);
