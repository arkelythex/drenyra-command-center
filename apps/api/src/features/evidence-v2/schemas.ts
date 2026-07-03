import { t } from "elysia";

export const EvidenceTypeEnum = t.UnionEnum([
	"INVOICE",
	"RECEIPT",
	"CONTRACT",
	"BANK_STATEMENT",
	"EMAIL",
	"XML",
	"CDR",
	"PDF",
	"OTHER",
]);

export const EvidenceStatusEnum = t.UnionEnum([
	"UPLOADED",
	"EXTRACTING",
	"CLASSIFIED",
	"VALIDATED",
	"REJECTED",
	"ERROR",
]);

export const EvidenceSourceEnum = t.UnionEnum([
	"UPLOAD",
	"EMAIL",
	"API",
	"SYNC",
	"SUNAT",
]);

export const EntityTypeEnum = t.UnionEnum([
	"journal_entry",
	"thread",
	"diff",
	"agent_run",
]);

export const RelationshipEnum = t.UnionEnum([
	"source",
	"supporting",
	"output",
	"audit_trail",
]);

export const IdParams = t.Object({
	id: t.String({ minLength: 1 }),
});

export const SearchQuery = t.Object({
	companyId: t.Optional(t.String()),
	type: t.Optional(t.String()),
	source: t.Optional(t.String()),
	status: t.Optional(t.String()),
	period: t.Optional(t.String()),
	q: t.Optional(t.String()),
	limit: t.Optional(t.Number()),
	offset: t.Optional(t.Number()),
});

export const LinkBody = t.Object({
	evidenceId: t.String({ minLength: 1 }),
	entityType: EntityTypeEnum,
	entityId: t.String({ minLength: 1 }),
	relationship: t.Optional(RelationshipEnum),
});

export const UnlinkBody = t.Object({
	linkId: t.String({ minLength: 1 }),
});

export const BatchValidateBody = t.Object({
	ids: t.Array(t.String(), { minItems: 1 }),
});

export const LineageParams = t.Object({
	entityType: t.String({ minLength: 1 }),
	entityId: t.String({ minLength: 1 }),
});
