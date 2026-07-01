import type { Organization } from "@arkelythex/domain";
import { PostgresOrganizationRepository } from "@arkelythex/persistence";
import { getErrorMessage } from "../shared/api-response";
import type {
	AlertResponse,
	ClientDetailResponse,
	ClientFilterParams,
	ClientSummaryResponse,
	DashboardResponse,
	UpdateClientSettingsBody,
} from "./types";

const repo = new PostgresOrganizationRepository();

function mapClientSummary(org: Organization): ClientSummaryResponse {
	const json = org.toJSON();
	return {
		id: json.id as string,
		name: json.name as string,
		ruc: json.ruc as string,
		status: json.status as string,
		healthScore: (json.healthScore as number | undefined) ?? null,
		lastActivity: null,
		pendingItems: 0,
	};
}

function mapClientDetail(org: Organization): ClientDetailResponse {
	const json = org.toJSON();
	return {
		id: json.id as string,
		name: json.name as string,
		ruc: json.ruc as string,
		slug: json.slug as string,
		status: json.status as string,
		healthScore: (json.healthScore as number | undefined) ?? null,
		settings: (json.settings as Record<string, unknown> | undefined) ?? null,
		createdAt: json.createdAt as string,
		updatedAt: json.updatedAt as string,
	};
}

export async function getDashboard(
	organizationId: string,
): Promise<DashboardResponse> {
	const org = await repo.findById(organizationId);
	if (!org) {
		throw new Error("Organization not found");
	}

	const metrics = await repo.getFirmMetrics(organizationId);
	const json = org.toJSON();

	return {
		organizationId: json.id as string,
		organizationName: json.name as string,
		organizationRuc: json.ruc as string,
		metrics,
		recentActivity: [],
		alerts: [],
	};
}

export async function getClients(
	_organizationId: string,
	filters: ClientFilterParams,
): Promise<{ clients: ClientSummaryResponse[]; total: number }> {
	const orgs = await repo.findAll({
		search: filters.search,
		status: filters.status,
		limit: filters.limit ?? 50,
		offset: filters.offset ?? 0,
	});

	const total = await repo.count({
		search: filters.search,
		status: filters.status,
	});

	return {
		clients: orgs.map(mapClientSummary),
		total,
	};
}

export async function getClient(
	_organizationId: string,
	clientId: string,
): Promise<ClientDetailResponse> {
	const client = await repo.findById(clientId);
	if (!client) {
		throw new Error("Client not found");
	}

	return mapClientDetail(client);
}

export async function updateClient(
	_organizationId: string,
	clientId: string,
	body: UpdateClientSettingsBody,
): Promise<ClientDetailResponse> {
	const client = await repo.findById(clientId);
	if (!client) {
		throw new Error("Client not found");
	}

	let updated = client;

	if (body.settings) {
		updated = updated.updateSettings(body.settings);
	}

	await repo.update(updated);

	return mapClientDetail(updated);
}

export async function getAlerts(
	_organizationId: string,
	_limit?: number,
	_offset?: number,
): Promise<{ alerts: AlertResponse[]; total: number }> {
	return { alerts: [], total: 0 };
}

export { getErrorMessage };
