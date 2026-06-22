import type {
	FiscalPolicyToolMapping,
	FiscalToolFamily,
} from "./fiscal-policy.types";

export const FISCAL_TOOL_POLICY_MAPPINGS: readonly FiscalPolicyToolMapping[] = [
	{
		family: "cpe",
		pattern: "cpe.*",
		defaultSunatImpact: "high",
		requiresEvidence: false,
		requiresDeterministicEngine: false,
		immutableWhenAcceptedCpe: true,
	},
	{
		family: "sire",
		pattern: "sire.*",
		defaultSunatImpact: "high",
		requiresEvidence: true,
		requiresDeterministicEngine: false,
		immutableWhenAcceptedCpe: false,
	},
	{
		family: "ple",
		pattern: "ple.*",
		defaultSunatImpact: "high",
		requiresEvidence: true,
		requiresDeterministicEngine: false,
		immutableWhenAcceptedCpe: false,
	},
	{
		family: "tax",
		pattern: "tax.*",
		defaultSunatImpact: "medium",
		requiresEvidence: false,
		requiresDeterministicEngine: true,
		immutableWhenAcceptedCpe: false,
	},
	{
		family: "detraction",
		pattern: "detraction.*",
		defaultSunatImpact: "medium",
		requiresEvidence: false,
		requiresDeterministicEngine: true,
		immutableWhenAcceptedCpe: false,
	},
	{
		family: "journal",
		pattern: "journal.*",
		defaultSunatImpact: "medium",
		requiresEvidence: false,
		requiresDeterministicEngine: false,
		immutableWhenAcceptedCpe: false,
	},
] as const;

const FISCAL_FAMILIES = new Set<FiscalToolFamily>([
	"cpe",
	"sire",
	"ple",
	"tax",
	"detraction",
	"journal",
]);

export const getFiscalToolFamily = (
	toolName: string,
): FiscalToolFamily | null => {
	const [family] = toolName.split(".");
	return FISCAL_FAMILIES.has(family as FiscalToolFamily)
		? (family as FiscalToolFamily)
		: null;
};

export const resolveFiscalToolMapping = (
	toolName: string,
): FiscalPolicyToolMapping | null => {
	const family = getFiscalToolFamily(toolName);
	if (!family) {
		return null;
	}

	return (
		FISCAL_TOOL_POLICY_MAPPINGS.find(
			(mapping) => mapping.family === family && toolName.startsWith(`${family}.`),
		) ?? null
	);
};

export const isUnmappedFiscalTool = (toolName: string): boolean => {
	return /^(cpe|sire|ple|tax|detraction|journal)([._-]|$)/.test(toolName) &&
		!resolveFiscalToolMapping(toolName);
};
