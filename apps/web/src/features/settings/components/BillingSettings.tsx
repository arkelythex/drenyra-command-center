import { CreditCard } from "lucide-react";
import { SettingsShell } from "./SettingsShell";
import { SettingsUnavailable } from "./SettingsUnavailable";

export const BillingSettings = () => (
	<SettingsShell
		title="Facturación"
		description="Plan, método de pago y comprobantes de tu suscripción."
		icon={CreditCard}
	>
		<SettingsUnavailable title="Aún no está disponible">
			La gestión del plan y de los pagos todavía no está conectada. Cuando lo
			esté, verás aquí tu plan real y tus comprobantes.
		</SettingsUnavailable>
	</SettingsShell>
);
