import { t } from "elysia";

export const createCustomerSchema = t.Object({
	companyId: t.String(),
	taxId: t.String(),
	legalName: t.String(),
	email: t.Optional(t.String()),
});

export const listCustomersQuerySchema = t.Object({
	companyId: t.Optional(t.String()),
});
