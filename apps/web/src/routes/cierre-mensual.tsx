import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { FiscalInspectorProvider } from "@/context/FiscalInspectorContext";

export const Route = createFileRoute("/cierre-mensual")({
	component: () => (
		<FiscalInspectorProvider>
			<CierreMensualPage />
		</FiscalInspectorProvider>
	),
});

const CierreMensualPage = lazyRouteComponent(
	() => import("../features/cierre-mensual/CierreMensualPage"),
	"CierreMensualPage",
);
