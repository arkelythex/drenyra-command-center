import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Taxation route — redirigido al chat principal.
 *
 * AM3: Tributos se acceden ahora como artifact inline vía el agente.
 * Escribí "calcular tributos" en el chat para invocar la herramienta.
 */
export const Route = createFileRoute("/cumplimiento/taxation")({
	loader: () => {
		throw redirect({ to: "/" });
	},
});
