import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import type { FiscalAgentAnalysis } from "@drenyra/domain";
import { useFiscalInspector } from "@/context/FiscalInspectorContext";

export type AgentStatus = "idle" | "analyzing" | "ready" | "error";

interface AgentEntityState {
	/** Current agent analysis for this entity */
	analysis: FiscalAgentAnalysis | null;
	/** Agent status */
	status: AgentStatus;
	/** When the last analysis was performed */
	lastAnalysisAt: string | null;
}

interface AgentAwareContextType {
	/** Get the agent state for a specific entity by key */
	getAgentState: (entityKey: string) => AgentEntityState;
	/** Trigger agent analysis for an entity */
	analyze: (
		entityKey: string,
		module: string,
		companyRuc: string,
		summary: string,
	) => void;
	/** Clear agent analysis for an entity */
	clear: (entityKey: string) => void;
	/** Check if any agent is currently analyzing */
	isAnyAnalyzing: boolean;
}

const AgentAwareContext = createContext<AgentAwareContextType | null>(null);

export function AgentAwareProvider({ children }: { children: ReactNode }) {
	const [agentStates, setAgentStates] = useState<
		Record<string, AgentEntityState>
	>({});
	const { open: openInspector } = useFiscalInspector();

	const getAgentState = useCallback(
		(entityKey: string): AgentEntityState => {
			return (
				agentStates[entityKey] ?? {
					analysis: null,
					status: "idle",
					lastAnalysisAt: null,
				}
			);
		},
		[agentStates],
	);

	const analyze = useCallback(
		(
			entityKey: string,
			module: string,
			companyRuc: string,
			summary: string,
		) => {
			const traceId = `AGT-${Date.now().toString(36)}`;

			// Set to analyzing state
			setAgentStates((prev) => ({
				...prev,
				[entityKey]: {
					analysis: null,
					status: "analyzing",
					lastAnalysisAt: new Date().toISOString(),
				},
			}));

			// Simulate async agent analysis (would connect to API in production)
			setTimeout(() => {
				const analysis: FiscalAgentAnalysis = {
					agentId: "arbitro-01",
					agentName: "Arbitro Fiscal",
					confidence: 0.85 + Math.random() * 0.14,
					proposal: `Análisis completado para: ${summary}`,
					rationale:
						"Revisión automática completada. Sin discrepancias críticas detectadas en cruce con registros SUNAT.",
					detectedAt: new Date().toISOString(),
					risks:
						Math.random() > 0.7
							? ["Posible inconsistencia en fecha de emisión"]
							: [],
				};

				setAgentStates((prev) => ({
					...prev,
					[entityKey]: {
						analysis,
						status: "ready",
						lastAnalysisAt: new Date().toISOString(),
					},
				}));

				openInspector({
					traceId,
					summary,
					status: "ANALYZED",
					riskLevel: analysis.risks.length > 0 ? "MEDIUM" : "LOW",
					impact: module,
					proposedBy: "agent",
					requiresApproval: analysis.risks.length > 0,
					module: module as
						| "facturacion"
						| "compras"
						| "conciliacion"
						| "sire"
						| "cierre",
					companyRuc,
					createdAt: new Date().toISOString(),
					evidence: [],
					agentAnalysis: analysis,
				});
			}, 1200);
		},
		[openInspector],
	);

	const clear = useCallback((entityKey: string) => {
		setAgentStates((prev) => {
			const next = { ...prev };
			delete next[entityKey];
			return next;
		});
	}, []);

	const isAnyAnalyzing = Object.values(agentStates).some(
		(s) => s.status === "analyzing",
	);

	return (
		<AgentAwareContext.Provider
			value={{ getAgentState, analyze, clear, isAnyAnalyzing }}
		>
			{children}
		</AgentAwareContext.Provider>
	);
}

export function useAgentAware(): AgentAwareContextType {
	const ctx = useContext(AgentAwareContext);
	if (!ctx) {
		throw new Error("useAgentAware must be used within an AgentAwareProvider");
	}
	return ctx;
}
