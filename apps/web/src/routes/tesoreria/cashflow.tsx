import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Cashflow route — redirigido al chat principal.
 *
 * AM3: Flujo de caja se accede ahora como artifact inline
 * vía el agente. Escribí "proyectar flujo de caja"
 * en el chat para invocar la herramienta.
 */
export const Route = createFileRoute("/tesoreria/cashflow")({
	loader: () => {
		throw redirect({ to: "/" });
	},
});
