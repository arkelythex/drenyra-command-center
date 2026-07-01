import { t } from "elysia";

export const CreateTemplateBody = t.Object({
	companyId: t.String({ format: "uuid" }),
	name: t.String({ minLength: 1, maxLength: 255 }),
	channel: t.Enum({ email: "email", whatsapp: "whatsapp", in_app: "in_app" }),
	subject: t.Optional(t.String()),
	body: t.String({ minLength: 1 }),
	variables: t.Optional(t.Array(t.String())),
	category: t.Optional(t.String({ maxLength: 100 })),
});

export const UpdateTemplateBody = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
	channel: t.Optional(
		t.Enum({ email: "email", whatsapp: "whatsapp", in_app: "in_app" }),
	),
	subject: t.Optional(t.String()),
	body: t.Optional(t.String({ minLength: 1 })),
	variables: t.Optional(t.Array(t.String())),
	category: t.Optional(t.String({ maxLength: 100 })),
});

export const SendBody = t.Object({
	companyId: t.String({ format: "uuid" }),
	templateId: t.String({ format: "uuid" }),
	clientId: t.Optional(t.String({ format: "uuid" })),
	recipient: t.String({ minLength: 1, maxLength: 255 }),
	channel: t.Enum({ email: "email", whatsapp: "whatsapp", in_app: "in_app" }),
	variables: t.Optional(t.Record(t.String(), t.String())),
});

export const BatchSendBody = t.Object({
	companyId: t.String({ format: "uuid" }),
	templateId: t.String({ format: "uuid" }),
	clientIds: t.Array(t.String({ format: "uuid" }), { minItems: 1 }),
	channel: t.Enum({ email: "email", whatsapp: "whatsapp", in_app: "in_app" }),
	variables: t.Optional(t.Record(t.String(), t.String())),
});

export const CreateAutomationBody = t.Object({
	companyId: t.String({ format: "uuid" }),
	name: t.String({ minLength: 1, maxLength: 255 }),
	trigger: t.String({ minLength: 1, maxLength: 100 }),
	config: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const UpdateAutomationBody = t.Object({
	name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
	trigger: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
	config: t.Optional(t.Record(t.String(), t.Unknown())),
	enabled: t.Optional(t.Boolean()),
});
