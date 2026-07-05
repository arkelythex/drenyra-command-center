import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError, unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	type DocumentsApiRunbook,
	documentsTreatyClient,
	parseDocumentsEnvelopeError,
} from "../api/documents-treaty-client";
import type { DocumentListEntryDTO } from "../lib/map-document-to-review-item";
import { mapDocumentDtoToReviewItem } from "../lib/map-document-to-review-item";

export interface ReviewQueueActionError {
	action: "approve" | "reject";
	documentId: string;
	message: string;
	runbook: DocumentsApiRunbook | null;
}

interface PendingActionState {
	action: "approve" | "reject";
	documentId: string;
}

export interface UseReviewQueueResult {
	data: ReturnType<typeof mapDocumentDtoToReviewItem>[] | undefined;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => Promise<unknown>;
	actionError: ReviewQueueActionError | null;
	actionInFlight: PendingActionState | null;
	isActionPending: boolean;
	approveDocument: (documentId: string) => Promise<void>;
	rejectDocument: (documentId: string) => Promise<void>;
	retryLastAction: () => Promise<void>;
}

class ReviewQueueRequestError extends Error {
	runbook: DocumentsApiRunbook | null;

	constructor(message: string, runbook: DocumentsApiRunbook | null = null) {
		super(message);
		this.name = "ReviewQueueRequestError";
		this.runbook = runbook;
	}
}

function toReviewQueueRequestError(
	error: unknown,
	fallback: string,
): ReviewQueueRequestError {
	if (error instanceof ReviewQueueRequestError) {
		return error;
	}
	if (error instanceof ApiError) {
		return new ReviewQueueRequestError(error.message, null);
	}
	return new ReviewQueueRequestError(
		error instanceof Error ? error.message : fallback,
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseDocumentsListResponse(raw: unknown): DocumentListEntryDTO[] {
	if (!isRecord(raw)) {
		throw new ReviewQueueRequestError("Respuesta de documentos inválida");
	}

	if (raw.success !== true) {
		const parsed = parseDocumentsEnvelopeError(
			raw,
			"No se pudo cargar la cola de revisión",
		);
		throw new ReviewQueueRequestError(parsed.message, parsed.runbook);
	}

	const data = raw.data;
	if (!isRecord(data) || !Array.isArray(data.documents)) {
		throw new ReviewQueueRequestError(
			"Formato de listado de documentos inesperado",
		);
	}

	return data.documents as DocumentListEntryDTO[];
}

async function assertMutationSuccess(
	raw: unknown,
	fallback: string,
): Promise<void> {
	if (!isRecord(raw)) {
		throw new ReviewQueueRequestError(fallback);
	}

	if (raw.success !== true) {
		const parsed = parseDocumentsEnvelopeError(raw, fallback);
		throw new ReviewQueueRequestError(parsed.message, parsed.runbook);
	}
}

export function useReviewQueue(): UseReviewQueueResult {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	const [actionError, setActionError] = useState<ReviewQueueActionError | null>(
		null,
	);
	const [lastFailedAction, setLastFailedAction] =
		useState<PendingActionState | null>(null);
	const [actionInFlight, setActionInFlight] =
		useState<PendingActionState | null>(null);

	const queueQuery = useQuery({
		queryKey: ["review-queue", "documents", companyId],
		queryFn: async () => {
			try {
				const raw = await unwrap(
					documentsTreatyClient.get({
						query: {
							companyId,
							status: "revision_humana",
							limit: 100,
							offset: 0,
						},
					}),
				);
				const documents = parseDocumentsListResponse(raw);
				return documents.map(mapDocumentDtoToReviewItem);
			} catch (error: unknown) {
				throw toReviewQueueRequestError(
					error,
					"No se pudo cargar la cola de revisión",
				);
			}
		},
		enabled: Boolean(companyId),
	});

	const approveMutation = useMutation({
		mutationFn: async ({ documentId }: { documentId: string }) => {
			const raw = await unwrap(
				documentsTreatyClient
					.validate({ id: documentId })
					.post({ status: "approved" }),
			);
			await assertMutationSuccess(raw, "No se pudo aprobar el documento");
		},
	});

	const rejectMutation = useMutation({
		mutationFn: async ({ documentId }: { documentId: string }) => {
			const raw = await unwrap(
				documentsTreatyClient.reject({ id: documentId }).post({
					reason: "Rechazado por supervisor desde Review Cockpit",
					category: "other",
				}),
			);
			await assertMutationSuccess(raw, "No se pudo rechazar el documento");
		},
	});

	const finalizeActionSuccess = async (): Promise<void> => {
		setActionError(null);
		setLastFailedAction(null);
		setActionInFlight(null);
		await queueQuery.refetch();
	};

	const captureActionFailure = (
		action: "approve" | "reject",
		documentId: string,
		error: unknown,
		fallback: string,
	): void => {
		const parsed =
			error instanceof ReviewQueueRequestError
				? error
				: new ReviewQueueRequestError(fallback);

		setActionError({
			action,
			documentId,
			message: parsed.message,
			runbook: parsed.runbook,
		});
		setLastFailedAction({ action, documentId });
		setActionInFlight(null);
	};

	const approveDocument = async (documentId: string): Promise<void> => {
		setActionInFlight({ action: "approve", documentId });
		try {
			await approveMutation.mutateAsync({ documentId });
			await finalizeActionSuccess();
		} catch (error: unknown) {
			captureActionFailure(
				"approve",
				documentId,
				error,
				"No se pudo aprobar el documento",
			);
		}
	};

	const rejectDocument = async (documentId: string): Promise<void> => {
		setActionInFlight({ action: "reject", documentId });
		try {
			await rejectMutation.mutateAsync({ documentId });
			await finalizeActionSuccess();
		} catch (error: unknown) {
			captureActionFailure(
				"reject",
				documentId,
				error,
				"No se pudo rechazar el documento",
			);
		}
	};

	const retryLastAction = async (): Promise<void> => {
		if (!lastFailedAction) return;
		if (lastFailedAction.action === "approve") {
			await approveDocument(lastFailedAction.documentId);
			return;
		}
		await rejectDocument(lastFailedAction.documentId);
	};

	return {
		data: queueQuery.data,
		isLoading: queueQuery.isLoading,
		isError: queueQuery.isError,
		error: (queueQuery.error as Error | null) ?? null,
		refetch: queueQuery.refetch,
		actionError,
		actionInFlight,
		isActionPending: actionInFlight !== null,
		approveDocument,
		rejectDocument,
		retryLastAction,
	};
}
