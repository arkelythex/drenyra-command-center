/**
 * EvidenceLinkEntityType — polymorphic entity types that evidence can link to
 */
export type EvidenceLinkEntityType =
	| "journal_entry"
	| "thread"
	| "diff"
	| "agent_run";

export const EVIDENCE_LINK_ENTITY_TYPES: readonly EvidenceLinkEntityType[] = [
	"journal_entry",
	"thread",
	"diff",
	"agent_run",
] as const;

/**
 * EvidenceLinkRelationship — semantic relationship between evidence and entity
 * - source: the document that originated the entity
 * - supporting: additional supporting documentation
 * - output: the entity produced this evidence
 * - audit_trail: audit trail reference
 */
export type EvidenceLinkRelationship =
	| "source"
	| "supporting"
	| "output"
	| "audit_trail";

export const EVIDENCE_LINK_RELATIONSHIPS: readonly EvidenceLinkRelationship[] = [
	"source",
	"supporting",
	"output",
	"audit_trail",
] as const;
