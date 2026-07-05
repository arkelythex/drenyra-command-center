import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Payroll route — redirigido al chat principal.
 *
 * AM3: Nómina se accede ahora como artifact inline vía el agente.
 * Escribí "generar planilla" en el chat para invocar la herramienta.
 */
export const Route = createFileRoute("/operaciones/payroll")({
	loader: () => {
		throw redirect({ to: "/" });
	},
});
