import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Banking route — redirigido al chat principal.
 *
 * AM3: Banking se accede ahora como artifact inline vía el agente.
 * El usuario escribe "conciliar banco" en el chat y el agente
 * invoca la herramienta conciliar_banco() que renderiza el
 * resultado como BankingReconciliationArtifact en el thread.
 */
export const Route = createFileRoute("/tesoreria/banking")({
	loader: () => {
		throw redirect({ to: "/" });
	},
});
