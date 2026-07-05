import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { DemoFeatureUnavailable } from "../../components/demo-feature-unavailable";
import { isDemoFeatureEnabled } from "../../lib/demo-feature-flags";

const MobileInvoiceScanner = lazyRouteComponent(
	() => import("../../features/invoices/components/MobileInvoiceScanner"),
	"MobileInvoiceScanner",
);

export const Route = createFileRoute("/operaciones/scanner")({
	component: ScannerRoute,
});

function ScannerRoute() {
	if (!isDemoFeatureEnabled("scanner")) {
		return (
			<DemoFeatureUnavailable
				title="Escáner móvil deshabilitado en demo"
				description="El flujo de escaneo todavía no es una superficie estable para el pitch. Se desactiva para mantener la demo enfocada en facturación, dashboard y SIRE."
			/>
		);
	}

	return <MobileInvoiceScanner />;
}
