import {
	getTreatyRouteClient,
	type TreatyErrorShape,
	type TreatyResponse,
} from "@/lib/treaty-route-client";

/** List + detail under `/documents` (see `apps/api/src/features/documents`). */
export interface DocumentsApiRunbook {
	id: string;
	title?: string;
}

export interface DocumentsApiEnvelope<TData> {
	success: boolean;
	data: TData;
	error?: string;
	code?: string;
	supportMessage?: string;
	runbook?: DocumentsApiRunbook;
}

interface DocumentsListData {
	documents: unknown[];
	total: number;
	counts?: Record<string, number>;
}

interface DocumentsValidateData {
	id: string;
	status: string;
	updatedFields?: string[];
	confidence?: number;
}

interface DocumentsRejectData {
	id: string;
	status: string;
	rejectedAt?: string;
	rejectedBy?: string;
}

interface DocumentsRoute {
	get(options: {
		query: Record<string, string | number | undefined>;
	}): Promise<TreatyResponse<DocumentsApiEnvelope<DocumentsListData>>>;
	validate: (params: { id: string }) => {
		post(body: {
			correctedData?: {
				issuerRUC?: string;
				issuerName?: string;
				total?: number;
				igv?: number;
				documentDate?: string;
				pcgeAccount?: string;
			};
			status: "approved" | "needs_review";
		}): Promise<TreatyResponse<DocumentsApiEnvelope<DocumentsValidateData>>>;
	};
	reject: (params: { id: string }) => {
		post(body: {
			reason: string;
			category?: "invalid_format" | "duplicate" | "incorrect_data" | "other";
		}): Promise<TreatyResponse<DocumentsApiEnvelope<DocumentsRejectData>>>;
	};
}

export const documentsTreatyClient =
	getTreatyRouteClient<DocumentsRoute>("documents");

interface ParsedDocumentsApiError {
	message: string;
	runbook: DocumentsApiRunbook | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseRunbook(value: unknown): DocumentsApiRunbook | null {
	if (!isRecord(value)) return null;
	if (typeof value.id !== "string") return null;
	return {
		id: value.id,
		title: typeof value.title === "string" ? value.title : undefined,
	};
}

function parseEnvelopeMessage(value: unknown, fallback: string): ParsedDocumentsApiError {
	if (!isRecord(value)) {
		return { message: fallback, runbook: null };
	}

	const supportMessage =
		typeof value.supportMessage === "string" ? value.supportMessage : null;
	const errorMessage = typeof value.error === "string" ? value.error : null;
	const plainMessage = typeof value.message === "string" ? value.message : null;

	return {
		message: supportMessage ?? errorMessage ?? plainMessage ?? fallback,
		runbook: parseRunbook(value.runbook),
	};
}

export function parseDocumentsTreatyError(
	error: TreatyErrorShape | null | undefined,
	fallback: string,
): ParsedDocumentsApiError {
	if (!error) {
		return { message: fallback, runbook: null };
	}

	if (typeof error.value === "string") {
		return { message: error.value, runbook: null };
	}

	return parseEnvelopeMessage(error.value, fallback);
}

export function parseDocumentsEnvelopeError(
	value: unknown,
	fallback: string,
): ParsedDocumentsApiError {
	return parseEnvelopeMessage(value, fallback);
}
