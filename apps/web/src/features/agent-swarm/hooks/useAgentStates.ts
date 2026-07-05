/**
 * @fileoverview Hook para gestionar estados de agentes del enjambre
 * @module features/agent-swarm/hooks/useAgentStates
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentId, AgentStateTransition, AgentStatus } from "../types";
import { calculateSwarmProgress } from "../types";

/**
 * Estados iniciales por defecto para todos los agentes
 */
const DEFAULT_STATES: Record<AgentId, AgentStatus> = {
	lector: "ready",
	validador: "ready",
	arbitro: "ready",
	ejecutor: "ready",
};

/**
 * Secuencia de estados para simular progresión (modo demo/development)
 * En producción, estos estados vendrían del backend vía WebSocket
 */
const DEMO_SEQUENCE: Array<{
	agentId: AgentId;
	status: AgentStatus;
	delay: number;
	message?: string;
}> = [
	{
		agentId: "lector",
		status: "active",
		delay: 0,
		message: "Analizando documento...",
	},
	{
		agentId: "lector",
		status: "completed",
		delay: 1500,
		message: "Datos extraídos",
	},
	{
		agentId: "validador",
		status: "active",
		delay: 1500,
		message: "Validando contra SUNAT...",
	},
	{
		agentId: "validador",
		status: "completed",
		delay: 3000,
		message: "Validación exitosa",
	},
	{
		agentId: "arbitro",
		status: "active",
		delay: 3000,
		message: "Evaluando estrategia fiscal...",
	},
	{
		agentId: "arbitro",
		status: "completed",
		delay: 4500,
		message: "Decisión emitida",
	},
	{
		agentId: "ejecutor",
		status: "active",
		delay: 4500,
		message: "Registrando en ledger...",
	},
	{
		agentId: "ejecutor",
		status: "completed",
		delay: 6000,
		message: "Acción completada",
	},
];

interface UseAgentStatesOptions {
	/** Modo de operación: 'demo' para simulación, 'real' para producción */
	mode?: "demo" | "real";
	/** Callback cuando cambia el estado de un agente */
	onStateChange?: (transition: AgentStateTransition) => void;
	/** Callback cuando el enjambre completa todas las tareas */
	onComplete?: () => void;
}

interface UseAgentStatesReturn {
	/** Estados actuales de todos los agentes */
	states: Record<AgentId, AgentStatus>;
	/** Transición de estado de un agente específico */
	setAgentState: (
		agentId: AgentId,
		status: AgentStatus,
		message?: string,
	) => void;
	/** Resetear todos los estados a 'ready' */
	resetStates: () => void;
	/** Estadísticas del progreso del enjambre */
	progress: {
		completed: number;
		active: number;
		total: number;
		percentage: number;
	};
	/** Si hay algún agente activo actualmente */
	isProcessing: boolean;
	/** Si todos los agentes han completado */
	isComplete: boolean;
}

/**
 * Hook para gestionar los estados de los agentes del enjambre
 *
 * @example
 * ```tsx
 * const { states, progress, isProcessing } = useAgentStates({
 *   mode: 'demo',
 *   onComplete: () => console.log('Swarm complete!')
 * });
 * ```
 */
export function useAgentStates(
	isThinking: boolean,
	options: UseAgentStatesOptions = {},
): UseAgentStatesReturn {
	const { mode = "demo", onStateChange, onComplete } = options;

	const [states, setStates] =
		useState<Record<AgentId, AgentStatus>>(DEFAULT_STATES);
	const [, setTransitions] = useState<AgentStateTransition[]>([]);

	// Calcular métricas derivadas
	const progress = useMemo(() => calculateSwarmProgress(states), [states]);

	const isProcessing = useMemo(
		() => Object.values(states).some((s) => s === "active"),
		[states],
	);

	const isComplete = useMemo(
		() => Object.values(states).every((s) => s === "completed"),
		[states],
	);

	// Resetear estados cuando no está pensando
	useEffect(() => {
		if (!isThinking) {
			setStates(DEFAULT_STATES);

			setTransitions([]);
		}
	}, [isThinking]);

	// Simular progresión de estados en modo demo
	useEffect(() => {
		if (!isThinking || mode !== "demo") return;

		const timeouts: NodeJS.Timeout[] = [];

		DEMO_SEQUENCE.forEach(({ agentId, status, delay, message }) => {
			const timeout = setTimeout(() => {
				setStates((prev) => {
					const newStates = { ...prev, [agentId]: status };

					// Notificar cambio de estado
					const transition: AgentStateTransition = {
						agentId,
						status,
						timestamp: Date.now(),
						message,
					};

					setTransitions((prev) => [...prev, transition]);
					onStateChange?.(transition);

					// Verificar si está completo
					const newProgress = calculateSwarmProgress(newStates);
					if (newProgress.percentage === 100) {
						onComplete?.();
					}

					return newStates;
				});
			}, delay);

			timeouts.push(timeout);
		});

		return () => {
			timeouts.forEach(clearTimeout);
		};
	}, [isThinking, mode, onStateChange, onComplete]);

	// Función para actualizar estado manualmente
	const setAgentState = useCallback(
		(agentId: AgentId, status: AgentStatus, message?: string) => {
			setStates((prev) => {
				const newStates = { ...prev, [agentId]: status };

				const transition: AgentStateTransition = {
					agentId,
					status,
					timestamp: Date.now(),
					message,
				};

				setTransitions((prev) => [...prev, transition]);
				onStateChange?.(transition);

				return newStates;
			});
		},
		[onStateChange],
	);

	// Resetear todos los estados
	const resetStates = useCallback(() => {
		setStates(DEFAULT_STATES);
		setTransitions([]);
	}, []);

	return {
		states,
		setAgentState,
		resetStates,
		progress,
		isProcessing,
		isComplete,
	};
}

export default useAgentStates;
