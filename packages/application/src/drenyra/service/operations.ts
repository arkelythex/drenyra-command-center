import type { FiscalScope } from "@drenyra/domain/drenyra";
import type { DrenyraScopeGuard } from "../repository";
import type { DrenyraActorContext } from "./types";

export function nowIso(): string {
	return new Date().toISOString();
}

export function newId(prefix: string): string {
	return `${prefix}_${crypto.randomUUID()}`;
}

export function newTraceId(): string {
	return newId("trace");
}

export function makeScope(context: DrenyraActorContext): FiscalScope & DrenyraScopeGuard {
	return {
		companyId: context.companyId,
		companyRuc: context.companyRuc,
		organizationId: context.organizationId,
		period: context.period,
		countryCode: "PE",
	};
}

export async function digestText(value: string): Promise<string> {
	const data = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function assertRiskScore(score: number): void {
	if (!Number.isInteger(score) || score < 0 || score > 100) {
		throw new Error("riskScore must be an integer between 0 and 100");
	}
}

export function metadataWithIdempotency(metadata: Record<string, unknown> | undefined, idempotencyKey: string | undefined): Record<string, unknown> {
	return idempotencyKey ? { ...(metadata ?? {}), idempotencyKey } : metadata ?? {};
}

export function hasIdempotencyKey(record: { metadata: Record<string, unknown> }, idempotencyKey: string | undefined): boolean {
	return Boolean(idempotencyKey) && record.metadata.idempotencyKey === idempotencyKey;
}

export function hasCompleteInspectContext(context: DrenyraActorContext): boolean {
	return Boolean(
		context.companyId.trim() &&
			context.companyRuc.trim() &&
			context.organizationId.trim() &&
			context.period.trim() &&
			context.userId.trim(),
	);
}
