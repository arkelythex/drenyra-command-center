import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
<<<<<<< HEAD

export const Route = createFileRoute("/cierre-mensual")({
	component: lazyRouteComponent(
		() => import("../features/cierre-mensual/CierreMensualPage"),
		"CierreMensualPage",
=======
import { FiscalInspectorProvider } from "@/context/FiscalInspectorContext";

export const Route = createFileRoute("/cierre-mensual")({
	component: () => (
		<FiscalInspectorProvider>
			<CierreMensualPage />
		</FiscalInspectorProvider>
>>>>>>> main
	),
});

const CierreMensualPage = lazyRouteComponent(
	() => import("../features/cierre-mensual/CierreMensualPage"),
	"CierreMensualPage",
);
