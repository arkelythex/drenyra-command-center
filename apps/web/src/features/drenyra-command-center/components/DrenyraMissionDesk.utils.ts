import type { useSwarmStore } from "@/features/intelligence/stores/useSwarmStore";
import type { AgentRun } from "../api/drenyra-command-center.api";
import { DEBATE_AGENTS } from "./DrenyraMissionDesk.data";

type AppendRunLog = ReturnType<typeof useSwarmStore.getState>["appendRunLog"];
type SetActiveRunId = ReturnType<
	typeof useSwarmStore.getState
>["setActiveRunId"];
type UpsertRun = ReturnType<typeof useSwarmStore.getState>["upsertRun"];

export function seedBootstrapDebateLogs(
	runId: string,
	agentRun: AgentRun,
	appendRunLog: AppendRunLog,
	setActiveRunId: SetActiveRunId,
	upsertRun: UpsertRun,
): void {
	setActiveRunId(runId);
	upsertRun(runId, { status: "running" });

	const timestamp = new Date().toISOString();
	appendRunLog(runId, {
		type: "workflow-start",
		level: "info",
		message: "Orquestador inició misión fiscal multi-agente.",
		timestamp,
		agentName: "Orquestador",
	});

	const findings = agentRun.output?.findings ?? [];
	DEBATE_AGENTS.forEach((agentName, index) => {
		const finding = findings[index] ?? agentRun.output?.summary;
		if (!finding) return;
		appendRunLog(runId, {
			type: "agent-status",
			level: index === DEBATE_AGENTS.length - 1 ? "success" : "info",
			message: finding,
			timestamp: new Date(Date.now() + index * 400).toISOString(),
			agentName,
		});
	});
}
