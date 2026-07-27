import { useEffect, useRef } from "react";
import { useAgentActivityStore } from "../stores/agent-activity.store";
import type { AgentActivityEvent } from "../types/agent-activity";

/**
 * useDemoAgentActivity — generates mock agent activity for development.
 *
 * Creates a realistic simulation of multiple agents running.
 * Each agent has a script of events with realistic timing.
 * Only runs when no real agents are connected.
 */

const MOCK_AGENTS = [
	{
		id: "agent-ledger-01",
		name: "Ledger Agent",
		tasks: [
			{
				delay: 1000,
				type: "source_consulted" as const,
				label: "Consultando libro mayor",
				desc: "Leyendo movimientos del periodo Junio 2026",
				source: "Ledger",
			},
			{
				delay: 3000,
				type: "tool_executed" as const,
				label: "Clasificando 412 asientos",
				desc: "Aplicando reglas de clasificación contable",
				source: "Classifier",
				risk: "R1" as const,
			},
			{
				delay: 6000,
				type: "rule_applied" as const,
				label: "Verificando PCGE",
				desc: "Validando cuentas contra Plan Contable General",
				source: "PCGE",
			},
			{
				delay: 9000,
				type: "result_produced" as const,
				label: "18 conciliaciones propuestas",
				desc: "Diferencias encontradas: S/ 42,500",
				source: "Ledger",
				risk: "R2" as const,
			},
			{
				delay: 12000,
				type: "decision_pending" as const,
				label: "Esperando revisión",
				desc: "3 ajustes requieren aprobación profesional",
				source: "Review",
			},
		],
	},
	{
		id: "agent-sire-02",
		name: "SIRE Agent",
		tasks: [
			{
				delay: 2000,
				type: "source_consulted" as const,
				label: "Descargando RCE SUNAT",
				desc: "Obteniendo Registro de Compras y Ventas del periodo",
				source: "SUNAT",
			},
			{
				delay: 5000,
				type: "tool_executed" as const,
				label: "Comparando RCE vs Ledger",
				desc: "18,420 líneas analizadas",
				source: "SIRE Comparator",
			},
			{
				delay: 8000,
				type: "result_produced" as const,
				label: "127 diferencias detectadas",
				desc: "Materialidad estimada: S/ 184,000",
				source: "SIRE",
				risk: "R2" as const,
			},
		],
	},
];

export function useDemoAgentActivity(enabled = false) {
	const feeds = useAgentActivityStore((s) => s.feeds);
	const startFeed = useAgentActivityStore((s) => s.startFeed);
	const addEvent = useAgentActivityStore((s) => s.addEvent);
	const setAgentState = useAgentActivityStore((s) => s.setAgentState);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	useEffect(() => {
		if (!enabled) return;
		const hasRealAgents = Object.values(feeds).some(
			(f) => f.state === "working" || f.state === "verifying",
		);
		if (hasRealAgents) return;

		// Clear existing demo state
		useAgentActivityStore.getState().clearAll();

		// Start all agents
		for (const agent of MOCK_AGENTS) {
			startFeed(agent.id, agent.name);
		}

		// Schedule tasks for each agent
		for (const agent of MOCK_AGENTS) {
			setAgentState(agent.id, "working");

			for (const task of agent.tasks) {
				const timer = setTimeout(() => {
					const event: AgentActivityEvent = {
						id: `${agent.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
						agentId: agent.id,
						timestamp: new Date().toISOString(),
						type: task.type,
						label: task.label,
						description: task.desc,
						source: task.source,
						status: "completed",
						riskLevel: task.risk ?? undefined,
					};
					addEvent(agent.id, event);

					// Update state based on event type
					if (task.type === "decision_pending") {
						setAgentState(agent.id, "waiting_for_approval");
					} else if (task.type === "result_produced") {
						setAgentState(agent.id, "verifying");
					}
				}, task.delay);

				timersRef.current.push(timer);
			}
		}

		return () => {
			for (const timer of timersRef.current) {
				clearTimeout(timer);
			}
			timersRef.current = [];
		};
	}, [enabled, feeds, startFeed, addEvent, setAgentState]);
}
