import type { SkillCapability } from "./skill-capability";
import type { SkillCategory } from "./skill-category";
import type { SkillId } from "./skill-id";
import type { SkillStatus } from "./skill-status";
export interface SkillProps {
    id: SkillId;
    name: string;
    description: string;
    category: SkillCategory;
    version: string;
    author: string;
    capabilities: SkillCapability[];
    status: SkillStatus;
    metadata?: Record<string, unknown>;
}
export declare class Skill {
    readonly id: SkillId;
    readonly name: string;
    readonly description: string;
    readonly category: SkillCategory;
    readonly version: string;
    readonly author: string;
    readonly capabilities: readonly SkillCapability[];
    readonly status: SkillStatus;
    readonly metadata: Readonly<Record<string, unknown>>;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    private constructor();
    static create(props: SkillProps): Skill;
    static reconstitute(data: SkillProps & {
        createdAt: Date;
        updatedAt: Date;
    }): Skill;
    isInstalled(): boolean;
    isDeprecated(): boolean;
    withUpdatedVersion(version: string): Skill;
}
//# sourceMappingURL=skill.d.ts.map