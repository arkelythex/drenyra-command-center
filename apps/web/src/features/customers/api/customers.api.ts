import { api } from "@/lib/api-client";
import { extractOkData, unwrap } from "@/lib/api-helpers";

/** Row of `GET /api/customers` (`Customer.toJSON()` on the API). */
export interface CustomerRecord {
	id: string;
	companyId: string;
	taxId: string;
	legalName: string;
	email?: string | null;
	/** Not sent by the API today; kept for callers that fall back to it. */
	tradeName?: string | null;
	name?: string | null;
}

/** What `POST /api/customers` needs; the API checks the RUC (Módulo 11). */
export interface NewCustomer {
	companyId: string;
	taxId: string;
	legalName: string;
}

export const customersApi = {
	/** Active customers of the company, newest first. */
	async list({ companyId }: { companyId: string }): Promise<CustomerRecord[]> {
		const envelope = await unwrap(
			api.api.customers.get({ query: { companyId } }),
		);
		return extractOkData<CustomerRecord[]>(
			envelope,
			"No se pudieron cargar los clientes",
		);
	},

	/** Registers a customer; throws with the API's reason when refused. */
	async create(customer: NewCustomer): Promise<CustomerRecord> {
		const envelope = await unwrap(api.api.customers.post(customer));
		return extractOkData<CustomerRecord>(
			envelope,
			"No se pudo registrar el cliente",
		);
	},
};
