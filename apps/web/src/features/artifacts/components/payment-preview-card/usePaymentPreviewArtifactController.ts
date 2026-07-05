import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { usePolicyGate } from "../../policy";
import type {
	ArtifactInteractionEvent,
	PaymentBeneficiary,
	PaymentPreviewArtifact,
} from "../../types/artifact.types";
import { createPaymentPreviewBatchActions } from "./batch-actions";
import type { PaymentBeneficiaryDraft } from "./types";
import {
	assessInlineEditRisk,
	buildBeneficiaryAmountPatch,
	buildPaymentTableRows,
	computeTotalAmount,
	emitPaymentEvent,
	ensureSelectedBeneficiary,
	formatMoney,
	getNextSelectionId,
	parseInlineAmount,
} from "./utils";

interface UsePaymentPreviewArtifactControllerInput {
	artifact: PaymentPreviewArtifact;
	onEvent: (event: ArtifactInteractionEvent) => void;
}

export function usePaymentPreviewArtifactController({
	artifact,
	onEvent,
}: UsePaymentPreviewArtifactControllerInput) {
	const { requestApproval } = usePolicyGate();
	const confirmAction = artifact.actions.find(
		(action) => action.id === "confirm-payment",
	);

	const [beneficiaries, setBeneficiaries] = useState<PaymentBeneficiary[]>(
		artifact.data.beneficiaries,
	);
	const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<
		string | null
	>(artifact.data.beneficiaries[0]?.id ?? null);
	const [editingBeneficiaryId, setEditingBeneficiaryId] = useState<
		string | null
	>(null);
	const [promptsByBeneficiary, setPromptsByBeneficiary] = useState<
		Record<string, string>
	>({});
	const [draftsByBeneficiary, setDraftsByBeneficiary] = useState<
		Record<string, PaymentBeneficiaryDraft>
	>({});

	const totalAmount = useMemo(
		() => computeTotalAmount(beneficiaries),
		[beneficiaries],
	);
	const tableRows = useMemo(
		() =>
			buildPaymentTableRows(
				beneficiaries,
				artifact.data.currency,
				artifact.data.provider,
			),
		[artifact.data.currency, artifact.data.provider, beneficiaries],
	);
	const beneficiariesById = useMemo(
		() =>
			new Map(
				beneficiaries.map((beneficiary) => [beneficiary.id, beneficiary]),
			),
		[beneficiaries],
	);

	useEffect(() => {
		const ensured = ensureSelectedBeneficiary(
			beneficiaries,
			selectedBeneficiaryId,
		);
		if (ensured !== selectedBeneficiaryId) {
			setSelectedBeneficiaryId(ensured);

			setEditingBeneficiaryId(null);
		}
	}, [beneficiaries, selectedBeneficiaryId]);

	const moveSelection = (direction: "up" | "down") => {
		const nextId = getNextSelectionId(
			beneficiaries,
			selectedBeneficiaryId,
			direction,
		);
		setSelectedBeneficiaryId(nextId);
	};

	const toggleInlineEditor = (beneficiaryId: string) => {
		setSelectedBeneficiaryId(beneficiaryId);
		setEditingBeneficiaryId((current) =>
			current === beneficiaryId ? null : beneficiaryId,
		);
	};

	const suggestInlineEditById = (beneficiaryId: string) => {
		const beneficiary = beneficiariesById.get(beneficiaryId);
		if (!beneficiary) return;

		const prompt = promptsByBeneficiary[beneficiaryId] ?? "";
		const nextAmount = parseInlineAmount(prompt);

		if (nextAmount === null) {
			toast.error("No se pudo interpretar monto para editar beneficiario.");
			onEvent(
				emitPaymentEvent(
					artifact,
					"inline-payment-edit-invalid",
					`Beneficiario ${beneficiary.name}: instruccion invalida para edicion inline.`,
				),
			);
			return;
		}

		if (nextAmount === beneficiary.amount) {
			toast.info("El monto sugerido es igual al valor actual.");
			return;
		}

		const patch = buildBeneficiaryAmountPatch(beneficiary, nextAmount);
		const draft: PaymentBeneficiaryDraft = {
			beneficiaryId,
			nextAmount,
			note: `Sugerencia IA: ${formatMoney(beneficiary.amount, artifact.data.currency)} -> ${formatMoney(nextAmount, artifact.data.currency)}`,
			patch,
		};

		setDraftsByBeneficiary((prev) => ({ ...prev, [beneficiaryId]: draft }));

		onEvent({
			...emitPaymentEvent(
				artifact,
				"inline-payment-edit-preview",
				`Beneficiario ${beneficiary.name}: sugerencia de monto generada.`,
			),
			payload: { patches: [patch], patchCount: 1 },
		});
	};

	const applyInlineEditById = async (beneficiaryId: string) => {
		const beneficiary = beneficiariesById.get(beneficiaryId);
		const draft = draftsByBeneficiary[beneficiaryId];
		if (!beneficiary || !draft) return;

		const risk = assessInlineEditRisk(beneficiary.amount, draft.nextAmount);
		let policyPayload: Record<string, unknown> | undefined;

		if (risk.requiresPolicyGate) {
			const policyDecision = await requestApproval({
				artifactId: artifact.id,
				artifactType: artifact.type,
				traceId: artifact.metadata.traceId,
				actionId: "inline-payment-edit-apply",
				actionLabel: `Editar monto inline (${beneficiary.name})`,
				riskLevel: risk.riskLevel,
				policyGate: {
					policyKey: "PAYMENT_INLINE_EDIT",
					requiresReason: true,
					requiresDualApproval: risk.riskLevel === "CRITICAL",
				},
			});

			if (!policyDecision.allowed || !policyDecision.proof) {
				toast.error(
					policyDecision.reason ?? "Policy gate rechazo editar el monto.",
				);
				onEvent(
					emitPaymentEvent(
						artifact,
						"policy-gate-denied",
						policyDecision.reason ??
							`Beneficiario ${beneficiary.name}: edicion bloqueada por policy gate.`,
					),
				);
				return;
			}

			policyPayload = {
				policy: {
					key: "PAYMENT_INLINE_EDIT",
					riskLevel: risk.riskLevel,
				},
				approval: policyDecision.proof,
			};
		}

		setBeneficiaries((current) =>
			current.map((item) =>
				item.id === beneficiaryId
					? { ...item, amount: draft.nextAmount }
					: item,
			),
		);
		setDraftsByBeneficiary((prev) => {
			const next = { ...prev };
			delete next[beneficiaryId];
			return next;
		});

		onEvent({
			...emitPaymentEvent(
				artifact,
				"inline-payment-edit-apply",
				`Beneficiario ${beneficiary.name}: monto actualizado a ${formatMoney(draft.nextAmount, artifact.data.currency)}.`,
			),
			payload: {
				...(policyPayload ?? {}),
				patches: [draft.patch],
				patchCount: 1,
			},
		});
	};

	const batchActions = createPaymentPreviewBatchActions({
		artifact,
		confirmAction,
		beneficiaries,
		totalAmount,
		tableRows,
		onEvent,
		requestApproval,
	});

	return {
		beneficiaries,
		totalAmount,
		selectedBeneficiaryId,
		editingBeneficiaryId,
		promptsByBeneficiary,
		draftsByBeneficiary,
		setSelectedBeneficiaryId,
		setEditingBeneficiaryId,
		setPromptsByBeneficiary,
		moveSelection,
		toggleInlineEditor,
		suggestInlineEditById,
		applyInlineEditById,
		...batchActions,
	};
}
