/**
 * Email Actions - MIGRATED TO EDEN TREATY
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getGovernanceAuditHeaders, getTenantHeaders } from "@/lib/api";
import { runtimeConfig } from "@/lib/runtime-config";
import { invoiceKeys } from "../api/query-keys";

interface SendInvoiceEmailPayload {
	invoiceId: string;
	customMessage?: string;
}

interface EmailActionResult {
	message: string;
}

interface EmailActionEnvelope {
	success?: boolean;
	data?: EmailActionResult;
	error?: string;
	message?: string;
}

const EMAIL_API_URL = runtimeConfig.apiUrl;

async function postEmailAction(
	path: string,
	body?: Record<string, string>,
): Promise<EmailActionResult> {
	const response = await fetch(`${EMAIL_API_URL}${path}`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...getTenantHeaders(),
			...getGovernanceAuditHeaders(),
		},
		body: body ? JSON.stringify(body) : undefined,
	});

	const payload = (await response.json()) as EmailActionEnvelope;

	if (!response.ok || payload.success === false || !payload.data) {
		throw new Error(
			payload.error || payload.message || "Error al enviar email",
		);
	}

	return payload.data;
}

export function useSendInvoiceEmail() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			invoiceId,
			customMessage,
		}: SendInvoiceEmailPayload) => {
			return postEmailAction(
				`/api/emails/send-invoice/${encodeURIComponent(invoiceId)}`,
				customMessage ? { customMessage } : undefined,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
		},
	});
}

export function useSendPaymentConfirmation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (invoiceId: string) => {
			return postEmailAction(
				`/api/emails/send-payment-confirmation/${encodeURIComponent(invoiceId)}`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
		},
	});
}

export function useSendReminder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (invoiceId: string) => {
			return postEmailAction(
				`/api/emails/send-reminder/${encodeURIComponent(invoiceId)}`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
		},
	});
}

export function useSendOverdueNotice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (invoiceId: string) => {
			return postEmailAction(
				`/api/emails/send-overdue-notice/${encodeURIComponent(invoiceId)}`,
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
		},
	});
}
