export class SkillInstallation {
    id;
    companyId;
    skillId;
    status;
    config;
    installedAt;
    installedBy;
    updatedAt;
    constructor(id, companyId, skillId, status, config, installedAt, installedBy, updatedAt) {
        this.id = id;
        this.companyId = companyId;
        this.skillId = skillId;
        this.status = status;
        this.config = config;
        this.installedAt = installedAt;
        this.installedBy = installedBy;
        this.updatedAt = updatedAt;
    }
    static create(props) {
        return new SkillInstallation(props.id, props.companyId, props.skillId, props.status, props.config, props.installedAt, props.installedBy, new Date());
    }
    static reconstitute(data) {
        return new SkillInstallation(data.id, data.companyId, data.skillId, data.status, data.config, data.installedAt, data.installedBy, data.updatedAt);
    }
    withConfig(config) {
        return new SkillInstallation(this.id, this.companyId, this.skillId, this.status, config, this.installedAt, this.installedBy, new Date());
    }
    withStatus(status) {
        return new SkillInstallation(this.id, this.companyId, this.skillId, status, this.config, this.installedAt, this.installedBy, new Date());
    }
    isEnabled() {
        return this.status === "installed";
    }
}
//# sourceMappingURL=skill-installation.js.map