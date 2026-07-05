import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	drenyraCommandCenterApi,
	type AddEvidenceRequest,
	type CreateFiscalCaseRequest,
} from "../api/drenyra-command-center.api";
import type { DrenyraAgentType, FiscalCaseStatus } from "@drenyra/domain/drenyra";
import { notify } from "./useNotifications";

const drenyraKeys = {
	cases: ["drenyra", "cases"] as const,
	details: (caseId: string) => ["drenyra", "cases", caseId] as const,
};

interface MutationCallbacks {
	onCaseCreated?: (caseId: string) => void;
}

export function useDrenyraMutations(
	activeCaseId: string | null,
	callbacks?: MutationCallbacks,
) {
	const queryClient = useQueryClient();

	const invalidate = async (caseId?: string) => {
		await queryClient.invalidateQueries({ queryKey: drenyraKeys.cases });
		if (caseId) {
			await queryClient.invalidateQueries({
				queryKey: drenyraKeys.details(caseId),
			});
		}
	};

	const createCase = useMutation({
		mutationFn: (request: CreateFiscalCaseRequest) =>
			drenyraCommandCenterApi.createCase(request),
		onSuccess: async (created) => {
			await invalidate(created.id);
			callbacks?.onCaseCreated?.(created.id);
			notify({
				type: "case_created",
				title: "Caso creado",
				message: `${created.title} (${created.id.slice(0, 8)}…)`,
			});
		},
	});

	const startRun = useMutation({
		mutationFn: (agentType: DrenyraAgentType) =>
			drenyraCommandCenterApi.startAgentRun(activeCaseId ?? "", agentType),
		onSuccess: async (run) => {
			await invalidate(run.caseId);
			notify({
				type: "agent_complete",
				title: "Agente ejecutado",
				message: `Agente completó la corrida para el caso activo`,
			});
		},
	});

	const addEvidence = useMutation({
		mutationFn: (request: AddEvidenceRequest) =>
			drenyraCommandCenterApi.addEvidence(activeCaseId ?? "", request),
		onSuccess: async (evidence) => {
			await invalidate(evidence.caseId);
			notify({
				type: "evidence_added",
				title: "Evidencia adjuntada",
				message: evidence.title ?? "Documento agregado al caso activo",
			});
		},
	});

	const updateStatus = useMutation({
		mutationFn: (params: { status: FiscalCaseStatus; reason?: string }) =>
			drenyraCommandCenterApi.updateCaseStatus(activeCaseId ?? "", params),
		onSuccess: async (fiscalCase) => {
			await invalidate(fiscalCase.id);
			notify({
				type: "case_status",
				title: "Estado actualizado",
				message: `Caso movido a ${fiscalCase.status}`,
			});
		},
	});

	const requestApproval = useMutation({
		mutationFn: () =>
			drenyraCommandCenterApi.requestApproval(
				activeCaseId ?? "",
				"Aprobar preparación fiscal",
			),
		onSuccess: async (approval) => {
			await invalidate(approval.caseId);
			notify({
				type: "approval_requested",
				title: "Aprobación solicitada",
				message: "Se solicitó aprobación para el caso activo",
			});
		},
	});

	const isBusy =
		startRun.isPending ||
		addEvidence.isPending ||
		updateStatus.isPending ||
		requestApproval.isPending;

	return {
		createCase,
		startRun,
		addEvidence,
		updateStatus,
		requestApproval,
		isBusy,
		invalidate,
	};
}
