export class Skill {
    id;
    name;
    description;
    category;
    version;
    author;
    capabilities;
    status;
    metadata;
    createdAt;
    updatedAt;
    constructor(id, name, description, category, version, author, capabilities, status, metadata, createdAt, updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.category = category;
        this.version = version;
        this.author = author;
        this.capabilities = capabilities;
        this.status = status;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(props) {
        return new Skill(props.id, props.name, props.description, props.category, props.version, props.author, props.capabilities, props.status, props.metadata ?? {}, new Date(), new Date());
    }
    static reconstitute(data) {
        return new Skill(data.id, data.name, data.description, data.category, data.version, data.author, data.capabilities, data.status, data.metadata ?? {}, data.createdAt, data.updatedAt);
    }
    isInstalled() {
        return this.status === "active";
    }
    isDeprecated() {
        return this.status === "deprecated";
    }
    withUpdatedVersion(version) {
        return new Skill(this.id, this.name, this.description, this.category, version, this.author, this.capabilities, this.status, this.metadata, this.createdAt, new Date());
    }
}
//# sourceMappingURL=skill.js.map