import type { SkillId } from "./skill-id";
import type { InstallationStatus } from "./skill-status";
export interface SkillInstallationProps {
    id: string;
    companyId: string;
    skillId: SkillId;
    status: InstallationStatus;
    config: Record<string, unknown>;
    installedAt: Date;
    installedBy: string;
}
export declare class SkillInstallation {
    readonly id: string;
    readonly companyId: string;
    readonly skillId: SkillId;
    readonly status: InstallationStatus;
    readonly config: Readonly<Record<string, unknown>>;
    readonly installedAt: Date;
    readonly installedBy: string;
    readonly updatedAt: Date;
    private constructor();
    static create(props: SkillInstallationProps): SkillInstallation;
    static reconstitute(data: SkillInstallationProps & {
        updatedAt: Date;
    }): SkillInstallation;
    withConfig(config: Record<string, unknown>): SkillInstallation;
    withStatus(status: InstallationStatus): SkillInstallation;
    isEnabled(): boolean;
}
//# sourceMappingURL=skill-installation.d.ts.map