import { t } from "elysia";

export const TriggerTypeEnum = t.UnionEnum(["schedule", "event", "manual"]);

export const AutomationStatusEnum = t.UnionEnum([
	"active",
	"paused",
	"draft",
	"error",
]);

export const AutonomyEnum = t.UnionEnum([
	"suggest",
	"auto-approve",
	"execute",
]);

export const IdParams = t.Object({
	id: t.String({ minLength: 1 }),
});

export const CreateAutomationBody = t.Object({
	name: t.String({ minLength: 1 }),
	description: t.Optional(t.String()),
	triggerType: TriggerTypeEnum,
	triggerConfig: t.Object(
		{
			cron: t.Optional(t.String()),
			eventType: t.Optional(t.String()),
		},
		{ additionalProperties: true },
	),
	skillIds: t.Array(t.String(), { minItems: 1 }),
	autonomy: AutonomyEnum,
});

export const UpdateAutomationBody = t.Object({
	name: t.Optional(t.String({ minLength: 1 })),
	description: t.Optional(t.String()),
	triggerType: t.Optional(TriggerTypeEnum),
	triggerConfig: t.Optional(
		t.Object(
			{
				cron: t.Optional(t.String()),
				eventType: t.Optional(t.String()),
			},
			{ additionalProperties: true },
		),
	),
	skillIds: t.Optional(t.Array(t.String(), { minItems: 1 })),
	autonomy: t.Optional(AutonomyEnum),
});

export const ToggleBody = t.Object({
	active: t.Boolean(),
});

export const RunBody = t.Object({
	automationId: t.String({ minLength: 1 }),
});

export const LogQuery = t.Object({
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
});

export const ListAutomationQuery = t.Object({
	status: t.Optional(t.String()),
});
