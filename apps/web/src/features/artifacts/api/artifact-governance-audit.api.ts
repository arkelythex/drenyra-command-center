import { api, getGovernanceAuditHeaders, getTenantContext } from "@/lib/api";
import type { ArtifactInteractionEvent } from "../types/artifact.types";

/** Safe access to governance-audit branch of the Eden Treaty client (`App`). */
function getGovernanceAuditClient() {
	const client = api["governance-audit"];
	if (!client) throw new Error("governance-audit API client not configured");
	return client;
}

interface ListArtifactGovernanceEventsParams {
	traceId?: string;
	artifactType?: string;
	actionId?: string;
	limit?: number;
	offset?: number;
}

interface GovernanceEventEnvelope {
	id: string;
	artifactId: string;
	artifactType: string;
	traceId: string;
	actionId: string;
	message: string;
	nextStatus?: string;
	createdAt: string;
	payload?: Record<string, unknown>;
}

export async function persistArtifactGovernanceEvent(
	event: ArtifactInteractionEvent,
): Promise<void> {
	const { companyId } = getTenantContext();
	const govClient = getGovernanceAuditClient();
	const payload = {
		companyId,
		event: {
			artifactId: event.artifactId,
			artifactType: event.artifactType,
			traceId: event.traceId,
			actionId: event.actionId,
			message: event.message,
			nextStatus: event.nextStatus,
			createdAt: event.createdAt,
			payload: event.payload,
		},
	};

	const response = await govClient.events.post(payload, {
		headers: getGovernanceAuditHeaders(),
	});

	if (response.error) {
		const err = response.error as { value?: { message?: string } };
		throw new Error(
			err.value?.message ?? "Failed to persist artifact governance event",
		);
	}

	const body = response.data;
	if (
		body &&
		typeof body === "object" &&
		"success" in body &&
		body.success === false
	) {
		throw new Error(
			"error" in body && typeof body.error === "string"
				? body.error
				: "Failed to persist artifact governance event",
		);
	}
}

export async function listArtifactGovernanceEvents(
	params: ListArtifactGovernanceEventsParams = {},
): Promise<ArtifactInteractionEvent[]> {
	const { companyId } = getTenantContext();
	const govClient = getGovernanceAuditClient();
	const query = {
		companyId,
		limit: params.limit ?? 25,
		offset: params.offset ?? 0,
		...(params.traceId ? { traceId: params.traceId } : {}),
		...(params.artifactType ? { artifactType: params.artifactType } : {}),
		...(params.actionId ? { actionId: params.actionId } : {}),
	};

	const response = await govClient.events.get({
		query,
		headers: getGovernanceAuditHeaders(),
	});

	if (response.error) {
		const err = response.error as { value?: { message?: string } };
		throw new Error(
			err.value?.message ?? "Failed to list artifact governance events",
		);
	}

	const body = response.data;
	if (!body || typeof body !== "object" || !("success" in body)) {
		throw new Error("Failed to list artifact governance events");
	}
	if (body.success === false) {
		throw new Error(
			"error" in body && typeof body.error === "string"
				? body.error
				: "Failed to list artifact governance events",
		);
	}

	const items = body.data.items ?? [];
	return items.map((item: GovernanceEventEnvelope) => ({
		id: item.id,
		artifactId: item.artifactId,
		artifactType: item.artifactType,
		traceId: item.traceId,
		actionId: item.actionId,
		message: item.message,
		nextStatus: item.nextStatus as ArtifactInteractionEvent["nextStatus"],
		createdAt: item.createdAt,
		payload: item.payload,
	}));
}
