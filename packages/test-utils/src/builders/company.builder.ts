/**
 * Builder pattern for Company/Tenant test data.
 *
 * Creates realistic Peruvian company entities for multi-tenant testing.
 *
 * @example
 * ```ts
 * const company = new CompanyBuilder()
 *   .withRUC('20123456789')
 *   .withName('Mi Empresa SAC')
 *   .build();
 * ```
 */
import { RUC } from "@arkelythex/domain/value-objects/RUC";
import type { Currency } from "@arkelythex/domain/value-objects/Money";
import { BaseBuilder } from "./base.builder";

const DEFAULT_COMPANY_ID = "cmp_test_001";
const DEFAULT_RAZON_SOCIAL = "Empresa de Prueba SAC";
const DEFAULT_COMMERCIAL_NAME = "Empresa Test";
const DEFAULT_RUC = "20601234567";
const DEFAULT_CURRENCY: Currency = "PEN";

export interface CompanyData {
	id: string;
	razonSocial: string;
	commercialName: string;
	ruc: string;
	address: string;
	department: string;
	province: string;
	district: string;
	phone: string;
	email: string;
	currency: Currency;
	isActive: boolean;
	plan: "free" | "pro" | "enterprise";
	createdAt: Date;
	updatedAt: Date;
}

export class CompanyBuilder extends BaseBuilder<CompanyData> {
	constructor() {
		const now = new Date();
		super({
			id: DEFAULT_COMPANY_ID,
			razonSocial: DEFAULT_RAZON_SOCIAL,
			commercialName: DEFAULT_COMMERCIAL_NAME,
			ruc: DEFAULT_RUC,
			address: "Av. Test 123, Lima",
			department: "Lima",
			province: "Lima",
			district: "Miraflores",
			phone: "+51 999 888 777",
			email: "contacto@empresa-test.pe",
			currency: DEFAULT_CURRENCY,
			isActive: true,
			plan: "pro",
			createdAt: now,
			updatedAt: now,
		});
	}

	/**
	 * Set the company ID.
	 */
	withId(id: string): this {
		return this.set({ id });
	}

	/**
	 * Set the RUC (Registro Único de Contribuyentes).
	 */
	withRUC(ruc: string): this {
		// Validate RUC before setting
		RUC.create(ruc);
		return this.set({ ruc });
	}

	/**
	 * Set the legal name (razón social).
	 */
	withRazonSocial(razonSocial: string): this {
		return this.set({ razonSocial });
	}

	/**
	 * Set the commercial name (nombre comercial).
	 */
	withCommercialName(name: string): this {
		return this.set({ commercialName: name });
	}

	/**
	 * Set the address.
	 */
	withAddress(address: string): this {
		return this.set({ address });
	}

	/**
	 * Set the department.
	 */
	withDepartment(department: string): this {
		return this.set({ department });
	}

	/**
	 * Set the province.
	 */
	withProvince(province: string): this {
		return this.set({ province });
	}

	/**
	 * Set the district.
	 */
	withDistrict(district: string): this {
		return this.set({ district });
	}

	/**
	 * Set the phone number.
	 */
	withPhone(phone: string): this {
		return this.set({ phone });
	}

	/**
	 * Set the email.
	 */
	withEmail(email: string): this {
		return this.set({ email });
	}

	/**
	 * Set the subscription plan.
	 */
	withPlan(plan: "free" | "pro" | "enterprise"): this {
		return this.set({ plan });
	}

	/**
	 * Mark company as inactive.
	 */
	asInactive(): this {
		return this.set({ isActive: false });
	}

	/**
	 * Mark company as active.
	 */
	asActive(): this {
		return this.set({ isActive: true });
	}

	/**
	 * Set the default currency.
	 */
	withCurrency(currency: Currency): this {
		return this.set({ currency });
	}

	/**
	 * Build the Company data object.
	 */
	build(): CompanyData {
		const now = new Date();
		return {
			id: this.data.id ?? DEFAULT_COMPANY_ID,
			razonSocial: this.data.razonSocial ?? DEFAULT_RAZON_SOCIAL,
			commercialName: this.data.commercialName ?? DEFAULT_COMMERCIAL_NAME,
			ruc: this.data.ruc ?? DEFAULT_RUC,
			address: this.data.address ?? "Av. Test 123, Lima",
			department: this.data.department ?? "Lima",
			province: this.data.province ?? "Lima",
			district: this.data.district ?? "Miraflores",
			phone: this.data.phone ?? "+51 999 888 777",
			email: this.data.email ?? "contacto@empresa-test.pe",
			currency: this.data.currency ?? DEFAULT_CURRENCY,
			isActive: this.data.isActive ?? true,
			plan: this.data.plan ?? "pro",
			createdAt: this.data.createdAt ?? now,
			updatedAt: this.data.updatedAt ?? now,
		};
	}
}
