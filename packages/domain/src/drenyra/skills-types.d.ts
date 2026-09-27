export declare const LEXORI_SKILL_CATEGORY: {
    readonly SUNAT_CPE: "sunat-cpe";
    readonly SUNAT_SIRE: "sunat-sire";
    readonly SUNAT_PLE: "sunat-ple";
    readonly NIIF_PCGE: "niif-pcge";
    readonly FISCAL_IGV: "fiscal-igv";
    readonly FISCAL_DETRACTIONS: "fiscal-detractions";
    readonly FISCAL_RETENTIONS: "fiscal-retentions";
};
export type LexoriSkillCategory = (typeof LEXORI_SKILL_CATEGORY)[keyof typeof LEXORI_SKILL_CATEGORY];
export interface LexoriSkillRule {
    id: string;
    description: string;
    condition?: string;
    action?: string;
    references?: readonly string[];
}
export interface LexoriSkillDefinition {
    id: string;
    name: string;
    category: LexoriSkillCategory;
    description: string;
    version: string;
    rules: readonly LexoriSkillRule[];
    contextTemplate: string;
    tags?: readonly string[];
    modelHint?: string;
}
export interface LexoriSkillContextRequest {
    skillId: string;
    variables: Record<string, string>;
}
export interface LexoriSkillContextResult {
    skillId: string;
    category: LexoriSkillCategory;
    renderedContext: string;
    version: string;
}
export declare function validateLexoriSkillDefinition(skill: Partial<LexoriSkillDefinition>): skill is LexoriSkillDefinition;
export declare function renderLexoriSkillContext(skill: LexoriSkillDefinition, variables: Record<string, string>): LexoriSkillContextResult;
export declare const LEXORI_CANONICAL_SKILL_IDS: readonly ["sunat-cpe", "sunat-sire", "niif-pcge", "fiscal-igv", "fiscal-detractions", "fiscal-retentions"];
export type LexoriCanonicalSkillId = (typeof LEXORI_CANONICAL_SKILL_IDS)[number];
//# sourceMappingURL=skills-types.d.ts.map