import type { CreateCustomerDTO } from "../../../lib/schemas/customer.schema";

export function buildCustomerFormDefaults(
	activeCompanyId: string,
	defaultValues?: Partial<CreateCustomerDTO>,
): Partial<CreateCustomerDTO> {
	return {
		companyId: defaultValues?.companyId ?? activeCompanyId,
		taxId: "",
		legalName: "",
		tradeName: "",
		address: "",
		email: "",
		phone: "",
		creditLimit: undefined,
		creditDays: 30,
		status: "active",
		...defaultValues,
	};
}
