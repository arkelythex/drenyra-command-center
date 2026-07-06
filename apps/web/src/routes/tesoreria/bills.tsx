import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Bills route — redirigido al chat principal.
 *
 * AM3: Cuentas por pagar se accede ahora como artifact inline
 * vía el agente. Escribí "consultar facturas por pagar"
 * en el chat para invocar la herramienta.
 */
export const Route = createFileRoute("/tesoreria/bills")({
	loader: () => {
		throw redirect({ to: "/" });
	},
});
