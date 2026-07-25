/**
 * Messages fixtures — deterministas, inmutables.
 *
 * Proporciona mensajes para outbox → consumer escenarios.
 * Incluye pares con mismo message_id pero distinto hash (redelivery).
 */

import type { FiscalOperationFixture } from "./fiscal-operations";
import type { TenantScope } from "./tenants";

export interface MessageFixture {
	messageId: string;
	messageType: string;
	payload: Record<string, unknown>;
	payloadHash: string;
}

export interface MessagesFixture {
	invoiceCreated: MessageFixture;
	invoiceCreatedRedelivery: MessageFixture;
	sunatSubmissionTrigger: MessageFixture;
}

/** Simple hash helper determinista */
function hashPayload(payload: Record<string, unknown>): string {
	const str = JSON.stringify(payload);
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = (h << 5) - h + str.charCodeAt(i);
		h |= 0;
	}
	return Math.abs(h).toString(16).padStart(8, "0");
}

export function createMessageFixture(
	_tenantA: TenantScope,
	invoice: FiscalOperationFixture,
	overrides?: Partial<MessagesFixture>,
): MessagesFixture {
	const payload = {
		invoiceId: `inv-${invoice.invoiceNumber.replace(/\D/g, "")}`,
		companyId: invoice.companyId,
		billNumber: invoice.invoiceNumber,
		amount: invoice.amount,
	};

	const base: MessagesFixture = {
		invoiceCreated: {
			messageId: "msg-invoice-created-001",
			messageType: "invoice.created",
			payload,
			payloadHash: hashPayload(payload),
		},
		invoiceCreatedRedelivery: {
			messageId: "msg-invoice-created-001",
			messageType: "invoice.created",
			payload,
			payloadHash: hashPayload(payload),
		},
		sunatSubmissionTrigger: {
			messageId: "msg-sunat-trigger-001",
			messageType: "job.sunat.submit",
			payload: {
				invoiceId: `inv-${invoice.invoiceNumber.replace(/\D/g, "")}`,
				companyId: invoice.companyId,
			},
			payloadHash: "sunat-trigger-001",
		},
	};
	return { ...base, ...overrides };
}
