import { Elysia } from "elysia";
import { companyScopeGuard } from "../../shared/plugins";
import { fail, getErrorMessage, ok } from "../shared/api-response";
import { AppError } from "../../lib/errors";
import { skillsService } from "./skills.service";
import { SkillIdParams, CompanySkillConfigBody } from "./skills.schemas";

function handleError(error: unknown, set: { status: number }) {
	if (error instanceof AppError) {
		set.status = error.statusCode;
		return fail(error.message, error.errorCode);
	}
	set.status = 500;
	return fail(getErrorMessage(error), "INTERNAL_ERROR");
}

export const skillsRoutes = new Elysia({
	prefix: "/api/skills",
	name: "skills",
})
	.use(companyScopeGuard())

	// ─── List all skills ───
	.get(
		"/",
		async ({ companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				const result = await skillsService.listSkills(companyId);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			detail: {
				tags: ["Skills"],
				summary: "List all available skills",
			},
		},
	)

	// ─── List installed skills for company ───
	.get(
		"/installed",
		async ({ companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await skillsService.listInstalled(companyId);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			detail: {
				tags: ["Skills"],
				summary: "List installed skills for authenticated company",
			},
		},
	)

	// ─── Skill detail ───
	.get(
		"/:id",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				const result = await skillsService.getSkillDetail(params.id, companyId);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: SkillIdParams,
			detail: {
				tags: ["Skills"],
				summary: "Get skill detail with capabilities",
			},
		},
	)

	// ─── Install skill for company ───
	.post(
		"/:id/install",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await skillsService.installSkill(
					companyId,
					params.id,
					"current-user",
				);
				set.status = 201;
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: SkillIdParams,
			detail: {
				tags: ["Skills"],
				summary: "Install skill for authenticated company",
			},
		},
	)

	// ─── Uninstall skill from company ───
	.post(
		"/:id/uninstall",
		async ({ params, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await skillsService.uninstallSkill(companyId, params.id);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: SkillIdParams,
			detail: {
				tags: ["Skills"],
				summary: "Uninstall skill from authenticated company",
			},
		},
	)

	// ─── Update skill configuration for company ───
	.patch(
		"/:id/config",
		async ({ params, body, companyContext, set }) => {
			try {
				const companyId = companyContext?.companyId;
				if (!companyId) {
					set.status = 401;
					return fail("No autorizado", "UNAUTHORIZED");
				}
				const result = await skillsService.updateConfig(
					companyId,
					params.id,
					body.config,
				);
				return ok(result);
			} catch (error) {
				return handleError(error, s(set));
			}
		},
		{
			params: SkillIdParams,
			body: CompanySkillConfigBody,
			detail: {
				tags: ["Skills"],
				summary: "Update skill configuration for company",
			},
		},
	);

// Elysia's set type helper
function s(set: { status?: number | string }): { status: number } {
	return set as unknown as { status: number };
}
