export const LEXORI_SKILL_CATEGORY = {
    SUNAT_CPE: "sunat-cpe",
    SUNAT_SIRE: "sunat-sire",
    SUNAT_PLE: "sunat-ple",
    NIIF_PCGE: "niif-pcge",
    FISCAL_IGV: "fiscal-igv",
    FISCAL_DETRACTIONS: "fiscal-detractions",
    FISCAL_RETENTIONS: "fiscal-retentions",
};
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
//# sourceMappingURL=domain-barrel.js.map