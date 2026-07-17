import { z } from "zod";
import { BaseConnector } from "../../base.connector";
import { type ErpnextConfig, ErpnextConfigSchema } from "../../config";
import { ConnectorAuthError, ConnectorError } from "../../errors";
import type {
	ErpnextOperation,
	ErpnextResponse,
	JournalEntryInput,
	PartyInput,
} from "./erpnext.types";

/**
 * ERPNext connector — connects Drenyra to ERPNext accounting backend.
 *
 * Handles:
 * - Journal entry creation (fiscal events → GL posting)
 * - Party sync (RUC → Customer/Supplier)
 * - Trial balance queries
 *
 * Requires environment variables:
 * - DRENYRA_ERPNEXT_URL
 * - DRENYRA_ERPNEXT_API_KEY
 * - DRENYRA_ERPNEXT_API_SECRET
 */
export class ErpnextConnector extends BaseConnector<
	ErpnextConfig,
	ErpnextOperation
> {
	readonly name = "erpnext";

	constructor() {
		super();
		// Config is loaded lazily — validate env vars on connect
		this._config = null as unknown as ErpnextConfig;
	}

	private _config: ErpnextConfig;
	override get config(): ErpnextConfig {
		if (!this._config) {
			throw new Error("ERPNext connector not connected. Call connect() first.");
		}
		return this._config;
	}

	async connect(): Promise<void> {
		this.state = "connecting";
		try {
			this._config = ErpnextConfigSchema.parse({
				url: process.env.DRENYRA_ERPNEXT_URL,
				apiKey: process.env.DRENYRA_ERPNEXT_API_KEY,
				apiSecret: process.env.DRENYRA_ERPNEXT_API_SECRET,
				timeoutMs: process.env.DRENYRA_ERPNEXT_TIMEOUT_MS
					? Number(process.env.DRENYRA_ERPNEXT_TIMEOUT_MS)
					: undefined,
			});
			this.state = "connected";
		} catch (err) {
			this.state = "error";
			if (err instanceof z.ZodError) {
				throw new ConnectorError(
					`Invalid ERPNext configuration: ${err.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
					"erpnext",
				);
			}
			throw err;
		}
	}

	async disconnect(): Promise<void> {
		this.state = "disconnected";
	}

	async execute<TResult>(
		operation: ErpnextOperation,
		..._args: unknown[]
	): Promise<TResult> {
		return this.guardedExecute(async () => {
			const controller = new AbortController();
			const timeout = setTimeout(
				() => controller.abort(),
				this.config.timeoutMs,
			);

			try {
				switch (operation.type) {
					case "journal_entry.create":
						return (await this.createJournalEntry(
							operation.data,
							controller.signal,
						)) as TResult;
					case "journal_entry.list":
						return (await this.listJournalEntries(
							operation.filters,
							controller.signal,
						)) as TResult;
					case "party.create":
						return (await this.createParty(
							operation.data,
							controller.signal,
						)) as TResult;
					case "party.get":
						return (await this.getParty(
							operation.name,
							controller.signal,
						)) as TResult;
					case "trial_balance.get":
						return (await this.getTrialBalance(
							operation.filters,
							controller.signal,
						)) as TResult;
					case "health":
						return { status: "connected", version: "erpnext" } as TResult;
					default:
						throw new ConnectorError(
							`Unsupported operation: ${JSON.stringify(operation)}`,
							"erpnext",
						);
				}
			} finally {
				clearTimeout(timeout);
			}
		});
	}

	private async request<T>(
		method: string,
		endpoint: string,
		body?: unknown,
		signal?: AbortSignal,
	): Promise<ErpnextResponse<T>> {
		const response = await fetch(`${this.config.url}/api/method/${endpoint}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				Authorization: `token ${this.config.apiKey}:${this.config.apiSecret}`,
			},
			body: body ? JSON.stringify(body) : undefined,
			signal,
		});

		if (response.status === 401 || response.status === 403) {
			throw new ConnectorAuthError("erpnext", `HTTP ${response.status}`);
		}

		if (!response.ok) {
			throw new ConnectorError(
				`ERPNext request failed: ${response.status} ${response.statusText}`,
				"erpnext",
			);
		}

		return response.json() as Promise<ErpnextResponse<T>>;
	}

	private async createJournalEntry(
		data: JournalEntryInput,
		signal?: AbortSignal,
	): Promise<{ name: string }> {
		const result = await this.request<{ name: string }>(
			"POST",
			"frappe.client.insert",
			{
				doctype: "Journal Entry",
				...data,
			},
			signal,
		);
		return result.data;
	}

	private async listJournalEntries(
		filters?: Record<string, unknown>,
		signal?: AbortSignal,
	): Promise<Array<{ name: string }>> {
		const result = await this.request<Array<{ name: string }>>(
			"GET",
			"frappe.client.get_list",
			{
				doctype: "Journal Entry",
				filters,
			},
			signal,
		);
		return result.data;
	}

	private async createParty(
		data: PartyInput,
		signal?: AbortSignal,
	): Promise<{ name: string }> {
		const doctype = data.partyType === "Customer" ? "Customer" : "Supplier";
		const result = await this.request<{ name: string }>(
			"POST",
			"frappe.client.insert",
			{
				doctype,
				customer_name: data.partyName,
				supplier_name: data.partyName,
				tax_id: data.taxId,
				company: data.company,
				email: data.email,
				phone: data.phone,
			},
			signal,
		);
		return result.data;
	}

	private async getParty(
		name: string,
		signal?: AbortSignal,
	): Promise<Record<string, unknown>> {
		const result = await this.request<Record<string, unknown>>(
			"GET",
			"frappe.client.get",
			{
				doctype: "Customer",
				name,
			},
			signal,
		);
		return result.data;
	}

	private async getTrialBalance(
		filters?: { company: string; fromDate?: string; toDate?: string },
		signal?: AbortSignal,
	): Promise<Array<Record<string, unknown>>> {
		const result = await this.request<Array<Record<string, unknown>>>(
			"GET",
			"frappe.client.get_list",
			{
				doctype: "GL Entry",
				filters: {
					company: filters?.company,
					posting_date: filters?.fromDate
						? [">=", filters.fromDate]
						: undefined,
				},
			},
			signal,
		);
		return result.data;
	}
}
