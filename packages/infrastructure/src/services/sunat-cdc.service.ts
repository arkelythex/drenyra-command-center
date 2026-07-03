/**
 * SUNAT CDC — Change Data Capture for real-time SUNAT updates.
 * Instead of nightly polling, listen for SUNAT webhook callbacks.
 * When SUNAT updates a ticket status or sends a CDR, process immediately.
 */

export interface SunatCdcEvent {
	type: "TICKET_UPDATE" | "CDR_RECEIVED" | "DISCREPANCY_DETECTED" | "SCHEDULED_REFRESH";
	timestamp: Date;
	orgId: number;
	payload: Record<string, unknown>;
}

export class SunatCdcService {
	private handlers = new Map<SunatCdcEvent["type"], Array<(event: SunatCdcEvent) => Promise<void>>>();

	/**
	 * Register a handler for a CDC event type.
	 */
	on(type: SunatCdcEvent["type"], handler: (event: SunatCdcEvent) => Promise<void>): void {
		if (!this.handlers.has(type)) this.handlers.set(type, []);
		this.handlers.get(type)!.push(handler);
	}

	/**
	 * Emit a CDC event to all registered handlers.
	 */
	async emit(event: SunatCdcEvent): Promise<void> {
		const handlers = this.handlers.get(event.type) ?? [];
		await Promise.allSettled(handlers.map((h) => h(event)));
	}

	/**
	 * Handle a SUNAT ticket status update webhook.
	 */
	async handleTicketUpdate(params: {
		orgId: number;
		ticket: string;
		status: string;
		downloadCode?: string;
	}): Promise<void> {
		await this.emit({
			type: "TICKET_UPDATE",
			timestamp: new Date(),
			orgId: params.orgId,
			payload: params,
		});
	}

	/**
	 * Handle a CDR webhook callback from OSE.
	 */
	async handleCdrReceived(params: {
		orgId: number;
		transactionId: string;
		cdrStatus: string;
		cdrContent?: string;
	}): Promise<void> {
		await this.emit({
			type: "CDR_RECEIVED",
			timestamp: new Date(),
			orgId: params.orgId,
			payload: params,
		});
	}

	/**
	 * Trigger a scheduled refresh for an organization.
	 */
	async triggerScheduledRefresh(orgId: number): Promise<void> {
		await this.emit({
			type: "SCHEDULED_REFRESH",
			timestamp: new Date(),
			orgId,
			payload: { orgId },
		});
	}
}

export const sunatCdcService = new SunatCdcService();
