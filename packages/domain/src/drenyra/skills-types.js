export const LEXORI_SKILL_CATEGORY = {
    SUNAT_CPE: "sunat-cpe",
    SUNAT_SIRE: "sunat-sire",
    SUNAT_PLE: "sunat-ple",
    NIIF_PCGE: "niif-pcge",
    FISCAL_IGV: "fiscal-igv",
    FISCAL_DETRACTIONS: "fiscal-detractions",
    FISCAL_RETENTIONS: "fiscal-retentions",
};
export function validateLexoriSkillDefinition(skill) {
    if (!skill.id?.trim())
        return false;
    if (!skill.name?.trim())
        return false;
    if (!skill.description?.trim())
        return false;
    if (!skill.version?.trim())
        return false;
    if (!skill.contextTemplate?.trim())
        return false;
    if (!skill.category)
        return false;
    if (!Object.values(LEXORI_SKILL_CATEGORY).includes(skill.category)) {
        return false;
    }
    if (!Array.isArray(skill.rules))
        return false;
    for (const rule of skill.rules) {
        if (!rule.id?.trim() || !rule.description?.trim())
            return false;
    }
    return true;
}
export function renderLexoriSkillContext(skill, variables) {
    let rendered = skill.contextTemplate;
    for (const [key, value] of Object.entries(variables)) {
        rendered = rendered.replaceAll(`{${key}}`, value);
    }
    if (/\{[a-zA-Z_]+\}/.test(rendered)) {
        throw new Error(`Lexori skill ${skill.id}: unresolved template variables remain`);
    }
    return {
        skillId: skill.id,
        category: skill.category,
        renderedContext: rendered,
        version: skill.version,
    };
}
export const LEXORI_CANONICAL_SKILL_IDS = [
    "sunat-cpe",
    "sunat-sire",
    "niif-pcge",
    "fiscal-igv",
    "fiscal-detractions",
    "fiscal-retentions",
];
//# sourceMappingURL=skills-types.js.map