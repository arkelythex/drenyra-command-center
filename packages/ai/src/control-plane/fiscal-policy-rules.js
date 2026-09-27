export const FISCAL_TOOL_POLICY_MAPPINGS = [
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
];
const FISCAL_FAMILIES = new Set([
    "cpe",
    "sire",
    "ple",
    "tax",
    "detraction",
    "journal",
]);
export const getFiscalToolFamily = (toolName) => {
    const [family] = toolName.split(".");
    return FISCAL_FAMILIES.has(family)
        ? family
        : null;
};
export const resolveFiscalToolMapping = (toolName) => {
    const family = getFiscalToolFamily(toolName);
    if (!family) {
        return null;
    }
    return (FISCAL_TOOL_POLICY_MAPPINGS.find((mapping) => mapping.family === family && toolName.startsWith(`${family}.`)) ?? null);
};
export const isUnmappedFiscalTool = (toolName) => {
    return (/^(cpe|sire|ple|tax|detraction|journal)([._-]|$)/.test(toolName) &&
        !resolveFiscalToolMapping(toolName));
};
//# sourceMappingURL=fiscal-policy-rules.js.map