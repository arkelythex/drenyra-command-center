import { isValidRUC } from "@arkelythex/shared/validation/ruc";
import { z } from "zod";

export const customerSchema = z.object({
	id: z.string().optional(),
	companyId: z.string().min(1, "Company ID es requerido"),
	taxId: z
		.string()
		.length(11, "RUC debe tener exactamente 11 dígitos")
		.regex(/^\d+$/, "RUC debe contener solo números")
		.refine(isValidRUC, "RUC inválido (verificación módulo 11)"),
	legalName: z.string().min(1, "Razón social es requerida"),
	tradeName: z.string().optional(),
	address: z.string().min(1, "Dirección es requerida"),
	email: z.string().email("Email inválido"),
	phone: z.string().optional(),
	creditLimit: z.number().min(0).optional(),
	creditDays: z.number().int().min(0).optional(),
	status: z.enum(["active", "inactive"]).default("active"),
	createdAt: z.string().optional(),
	updatedAt: z.string().optional(),
});

export type Customer = z.infer<typeof customerSchema>;
export type CreateCustomerDTO = Omit<
	Customer,
	"id" | "createdAt" | "updatedAt"
>;
export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;

export const CustomerStatus = {
	ACTIVE: "active",
	INACTIVE: "inactive",
} as const;
