import { Elysia } from "elysia";
import { z } from "zod";
import { companyScopeGuard } from "../../shared/plugins/company-scope-guard";
import { ok } from "../shared/api-response";
import { switchContext } from "./application/commands/switch-context";

const SwitchBodySchema = z.object({
	companyId: z.string().min(1),
});

export const contextModule = new Elysia({ prefix: "/api/context" })
	.use(companyScopeGuard())
	.post(
		"/switch",
		async ({ body }) => {
			const result = await switchContext(body);
			return ok(result);
		},
		{
			body: SwitchBodySchema,
			detail: {
				tags: ["Auth"],
				summary: "Switch active company context",
			},
		},
	);
