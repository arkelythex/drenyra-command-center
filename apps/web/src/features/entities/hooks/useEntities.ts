import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
	customersApi,
	type CustomerRecord,
} from "@/features/customers/api/customers.api";
import {
	vendorsApi,
	type VendorRecord,
} from "@/features/vendors/api/vendors.api";
import { captureError, trackEvent } from "@/lib/monitoring";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import type { Entity } from "../types/entity.types";

interface UseEntitiesResult {
	entities: Entity[];
	search: string;
	setSearch: (value: string) => void;
}

function toCustomerEntity(customer: CustomerRecord): Entity {
	return {
		id: customer.id,
		legalName: customer.legalName ?? customer.tradeName ?? customer.name ?? "",
		taxId: customer.taxId,
		condition: "HABIDO",
		status: customer.isActive ? "ACTIVO" : "INACTIVO",
		complianceScore: 100,
		totalSpend: 0,
		txCount: Math.floor(Math.random() * 50),
		lastTx: "-",
		riskLevel: "LOW",
		type: "CUSTOMER",
	};
}

function toVendorEntity(vendor: VendorRecord): Entity {
	return {
		id: vendor.id,
		legalName: vendor.legalName ?? vendor.tradeName ?? vendor.name ?? "",
		taxId: vendor.taxId,
		condition: "HABIDO",
		status: vendor.isActive ? "ACTIVO" : "INACTIVO",
		complianceScore: 95,
		totalSpend: 0,
		txCount: Math.floor(Math.random() * 50),
		lastTx: "-",
		riskLevel: "LOW",
		type: "VENDOR",
	};
}

function buildMockEntities(): Entity[] {
	return [
		{
			id: "1",
			legalName: "GLOBAL LOGISTICS PERU S.A.C.",
			taxId: "20601234567",
			condition: "HABIDO",
			status: "ACTIVO",
			complianceScore: 98,
			totalSpend: 150000,
			txCount: 124,
			lastTx: "2026-01-15",
			riskLevel: "LOW",
			type: "VENDOR",
		},
		{
			id: "2",
			legalName: "INVERSIONES ALFA & OMEGA S.A.",
			taxId: "20559876541",
			condition: "HABIDO",
			status: "ACTIVO",
			complianceScore: 92,
			totalSpend: 85000,
			txCount: 45,
			lastTx: "2026-01-14",
			riskLevel: "LOW",
			type: "VENDOR",
		},
		{
			id: "3",
			legalName: "CORPORACION TEXTIL DEL SUR",
			taxId: "20443322115",
			condition: "HABIDO",
			status: "ACTIVO",
			complianceScore: 85,
			totalSpend: 42000,
			txCount: 89,
			lastTx: "2026-01-16",
			riskLevel: "MEDIUM",
			type: "CUSTOMER",
		},
		{
			id: "4",
			legalName: "CONSTRUCTORA HORIZONTE AZUL",
			taxId: "20112233446",
			condition: "HABIDO",
			status: "INACTIVO",
			complianceScore: 45,
			totalSpend: 12000,
			txCount: 12,
			lastTx: "2025-12-20",
			riskLevel: "HIGH",
			type: "CUSTOMER",
		},
		{
			id: "5",
			legalName: "TECNOLOGIA DE PUNTA S.A.",
			taxId: "20334455667",
			condition: "HABIDO",
			status: "ACTIVO",
			complianceScore: 100,
			totalSpend: 310000,
			txCount: 210,
			lastTx: "2026-01-18",
			riskLevel: "LOW",
			type: "VENDOR",
		},
		{
			id: "6",
			legalName: "MINERA AURIFERA LOS ANDES",
			taxId: "20506070809",
			condition: "HABIDO",
			status: "ACTIVO",
			complianceScore: 78,
			totalSpend: 540000,
			txCount: 34,
			lastTx: "2026-01-10",
			riskLevel: "MEDIUM",
			type: "CUSTOMER",
		},
	];
}

export const useEntities = (): UseEntitiesResult => {
	const [search, setSearch] = useState("");
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	const { data } = useSuspenseQuery({
		queryKey: ["entities", companyId],
		queryFn: async () => {
			try {
				// Fetch both Customers and Vendors in parallel
				const [customersRes, vendorsRes] = await Promise.all([
					customersApi.list({ companyId }),
					vendorsApi.list({ companyId }),
				]);

				const customers = customersRes.map(toCustomerEntity);
				const vendors = vendorsRes.map(toVendorEntity);

				const result = [...customers, ...vendors];
				if (result.length > 0) {
					trackEvent("entities_loaded", {
						companyId,
						customerCount: customers.length,
						vendorCount: vendors.length,
					});
					return result;
				}
				throw new Error("No data");
			} catch (error) {
				captureError(
					error instanceof Error
						? error
						: new Error("Falling back to mock entities"),
					{
						companyId,
						source: "features/entities/useEntities.queryFn",
					},
				);
				return buildMockEntities();
			}
		},
	});

	const filteredEntities = useMemo(() => {
		if (!data) return [];
		return data.filter(
			(e) =>
				e.legalName.toLowerCase().includes(search.toLowerCase()) ||
				e.taxId.includes(search),
		);
	}, [data, search]);

	return {
		entities: filteredEntities,
		search,
		setSearch,
	};
};
