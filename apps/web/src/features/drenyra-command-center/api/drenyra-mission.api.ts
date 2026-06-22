import { api, getGovernanceAuditHeaders, getOrganizationId } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { getCompanyContext } from "@/lib/company-context";
import { getActiveFiscalPeriod } from "@/lib/fiscal-period";
import { buildApiUrl, HttpClientError } from "@/lib/http-client";
import type {
	AgentRun,
	FiscalCase,
} from "@arkelythex/domain/drenyra";

export interface UploadedDocumentRef {
	id: string;
	status: string;
}

export interface DocumentMissionResult {
	fiscalCase: FiscalCase;
	agentRun: AgentRun;
	agentStreamQuery: {
		documentId: string;
		filename: string;
		mimeType: string;
	};
}

function missionHeaders(): Record<string, string> {
	const companyContext = getCompanyContext();
	return {
		...getGovernanceAuditHeaders(),
		"x-company-ruc": companyContext.ruc,
		"x-fiscal-period": getActiveFiscalPeriod(),
		"x-organization-id": getOrganizationId() || companyContext.companyId,
	};
}

export async function uploadFiscalDocument(
	file: File,
): Promise<UploadedDocumentRef> {
	const formData = new FormData();
	formData.append("file", file);
	const { companyId } = getCompanyContext();
	if (companyId) {
		formData.append("companyId", companyId);
	}

	const response = await fetch(buildApiUrl("/documents/upload"), {
		method: "POST",
		headers: missionHeaders(),
		body: formData,
	});

	const body = await response.json().catch(() => null);
	if (!response.ok) {
		const message =
			typeof body === "object" &&
			body !== null &&
			"error" in body &&
			typeof (body as { error?: unknown }).error === "string"
				? (body as { error: string }).error
				: "No se pudo subir el comprobante";
		throw new HttpClientError(message, "http_error", response.status, body);
	}

	const data =
		typeof body === "object" &&
		body !== null &&
		"data" in body &&
		typeof (body as { data?: unknown }).data === "object" &&
		(body as { data: { id?: string; status?: string } }).data !== null
			? (body as { data: { id: string; status: string } }).data
			: null;

	if (!data?.id) {
		throw new HttpClientError(
			"Respuesta de upload inválida",
			"parse_error",
			response.status,
			body,
		);
	}

	return { id: data.id, status: data.status ?? "queued_for_ocr" };
}

export async function bootstrapMissionFromDocument(input: {
	documentId: string;
	filename: string;
	mimeType?: string;
}): Promise<DocumentMissionResult> {
	const config = {
		headers: {
			"Content-Type": "application/json",
			...missionHeaders(),
		},
	};
	const body = await unwrap(
		api.api.drenyra.missions["from-document"].post(input, config),
	);
	return extractOkData(body, "No se pudo iniciar la misión fiscal");
}
