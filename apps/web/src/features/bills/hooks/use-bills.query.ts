import { z } from "zod";
import { getHttpStatusCode } from "@/lib/http-client";
import { captureError } from "@/lib/monitoring";
import { runtimeConfig } from "@/lib/runtime-config";
import { billsApi } from "../api/bills.api";
import { mapApiBillToBill } from "./use-bills.mappers";
import { MOCK_BILLS } from "./use-bills.mock-data";
import type { Bill } from "./use-bills.types";

const vendorSchema = z.object({
	id: z.string(),
	legalName: z.string(),
});

const vendorListSchema = z.array(vendorSchema);

const apiBillSchema = z.object({
	id: z.string(),
	vendorId: z.string(),
	status: z.string(),
	dueDate: z.string(),
	billNumber: z.string(),
	totalAmount: z
		.object({
			amount: z.string().optional(),
		})
		.optional(),
	currency: z.enum(["PEN", "USD", "EUR"]),
	updatedAt: z.string(),
	workflowEvents: z
		.array(
			z.object({
				changedAt: z.string().optional(),
				fromStatus: z.string().optional(),
				toStatus: z.string().optional(),
				actorId: z.string().optional(),
				actorName: z.string().optional(),
				reason: z.string().optional(),
			}),
		)
		.optional(),
});

const apiBillListSchema = z.array(apiBillSchema);

type VendorLike = z.infer<typeof vendorSchema>;
type ApiBillLike = z.infer<typeof apiBillSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function normalizeVendorPayload(payload: unknown): VendorLike[] {
	if (Array.isArray(payload)) {
		return vendorListSchema.parse(payload);
	}

	if (isRecord(payload) && Array.isArray(payload.vendors)) {
		return vendorListSchema.parse(payload.vendors);
	}

	return [];
}

function normalizeBillsPayload(payload: unknown): ApiBillLike[] {
	if (Array.isArray(payload)) {
		return apiBillListSchema.parse(payload);
	}

	if (isRecord(payload) && Array.isArray(payload.bills)) {
		return apiBillListSchema.parse(payload.bills);
	}

	return [];
}

function buildVendorsLookup(vendors: VendorLike[]): Map<string, VendorLike> {
	return new Map(vendors.map((vendor) => [vendor.id, vendor]));
}

export async function fetchBills(companyId: string): Promise<Bill[]> {
	if (runtimeConfig.mockMode) return MOCK_BILLS;

	try {
		const [rawBills, rawVendors] = await Promise.all([
			billsApi.list({ companyId }),
			billsApi.listVendors(companyId).catch(() => []),
		]);

		const apiBills = normalizeBillsPayload(rawBills);
		const vendors = normalizeVendorPayload(rawVendors);
		const vendorsById = buildVendorsLookup(vendors);

		return apiBills
			.filter((bill) => bill.status !== "CANCELLED")
			.map((bill) => {
				const vendorName =
					vendorsById.get(bill.vendorId)?.legalName ?? "Proveedor";
				return mapApiBillToBill(bill, vendorName);
			});
	} catch (error) {
		const status = getHttpStatusCode(error);
		if (status !== 404 && status !== 405 && status !== 501) {
			captureError(
				error instanceof Error ? error : new Error("Bills board unavailable"),
				{
					source: "bills-board",
					companyId,
					status,
				},
			);
		}
		return MOCK_BILLS;
	}
}
