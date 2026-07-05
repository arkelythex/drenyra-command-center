import { t } from "elysia";

export const validateRucSchema = t.Object({
	ruc: t.String(),
});
