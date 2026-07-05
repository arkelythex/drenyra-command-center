import { useCallback, useState } from "react";

export interface PlanStep {
	id: string;
	label: string;
	status: "pending" | "active" | "completed";
	agentId: string;
	description: string;
}

/**
 * useTaskPlanner: Hook modular para la gestión de roadmaps de ejecución.
 * Separa la planificación de la ejecución agéntica.
 */
export function useTaskPlanner() {
	const [activePlan, setActivePlan] = useState<PlanStep[] | null>(null);

	const createPlan = useCallback((objective: string) => {
		// Lógica de descomposición (Simulada para el prototipo)
		const steps: PlanStep[] = [
			{
				id: "1",
				label: "Ingesta de Datos",
				status: "pending",
				agentId: "lector",
				description: "Escaneo de Ledger y comprobantes.",
			},
			{
				id: "2",
				label: "Validación Fiscal",
				status: "pending",
				agentId: "validador",
				description: "Cruce contra reglas SIRE 2026.",
			},
			{
				id: "3",
				label: "Cierre Estratégico",
				status: "pending",
				agentId: "arbitro",
				description: "Generación de asiento de ajuste.",
			},
		];
		setActivePlan(steps);
	}, []);

	const updateStep = useCallback((id: string, status: PlanStep["status"]) => {
		setActivePlan((prev) =>
			prev ? prev.map((s) => (s.id === id ? { ...s, status } : s)) : null,
		);
	}, []);

	return {
		activePlan,
		createPlan,
		updatePlanStatus: updateStep,
		clearPlan: () => setActivePlan(null),
	};
}
