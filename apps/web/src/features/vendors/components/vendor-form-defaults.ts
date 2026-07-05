import type { CreateVendorDTO } from "@/lib/schemas/vendor.schema";

export function buildVendorFormDefaults(
	activeCompanyId: string,
	defaultValues?: Partial<CreateVendorDTO>,
): Partial<CreateVendorDTO> {
	return {
		companyId: defaultValues?.companyId ?? activeCompanyId,
		taxId: "",
		legalName: "",
		tradeName: "",
		address: "",
		email: "",
		phone: "",
		contactPerson: "",
		paymentTerms: 30,
		status: "active",
		...defaultValues,
	};
}
