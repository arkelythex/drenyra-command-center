import { t } from "elysia";

export const SkillCategoryEnum = t.UnionEnum([
	"fiscal",
	"finance",
	"operations",
	"audit",
]);

export const SkillStatusEnum = t.UnionEnum([
	"active",
	"deprecated",
	"experimental",
]);

export const InstallationStatusEnum = t.UnionEnum(["installed", "disabled"]);

export const SkillIdParams = t.Object({
	id: t.String({ minLength: 1 }),
});

export const CompanySkillConfigBody = t.Object({
	config: t.Object(
		{
			autoExecute: t.Optional(t.Boolean()),
			notifyOnDiff: t.Optional(t.Boolean()),
		},
		{ additionalProperties: true },
	),
});
