import { validateOrganizationBusinessRules, validateStatusTransition, } from "./validators";
export class Organization {
    props;
    constructor(props) {
        this.props = props;
        validateOrganizationBusinessRules(this.props);
        Object.freeze(this);
    }
    static create(props) {
        return new Organization(props);
    }
    static fromPrimitives(plainData) {
        const props = {
            id: plainData.id,
            name: plainData.name,
            ruc: plainData.ruc,
            slug: plainData.slug,
            settings: plainData.settings,
            status: plainData.status,
            healthScore: plainData.healthScore,
            metrics: plainData.metrics,
            createdAt: typeof plainData.createdAt === "string"
                ? new Date(plainData.createdAt)
                : plainData.createdAt,
            updatedAt: typeof plainData.updatedAt === "string"
                ? new Date(plainData.updatedAt)
                : plainData.updatedAt,
        };
        return new Organization(props);
    }
    suspend(reason) {
        validateStatusTransition(this.props.status, "SUSPENDED");
        return new Organization({
            ...this.props,
            status: "SUSPENDED",
            settings: reason
                ? { ...this.props.settings, ...{ suspensionReason: reason } }
                : this.props.settings,
            updatedAt: new Date(),
        });
    }
    reactivate() {
        validateStatusTransition(this.props.status, "ACTIVE");
        return new Organization({
            ...this.props,
            status: "ACTIVE",
            updatedAt: new Date(),
        });
    }
    updateSettings(settings) {
        return new Organization({
            ...this.props,
            settings: { ...this.props.settings, ...settings },
            updatedAt: new Date(),
        });
    }
    updateHealthScore(score) {
        return new Organization({
            ...this.props,
            healthScore: score,
            metrics: this.props.metrics
                ? { ...this.props.metrics, healthPercentage: score }
                : undefined,
            updatedAt: new Date(),
        });
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.id === other.props.id;
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get ruc() {
        return this.props.ruc;
    }
    get slug() {
        return this.props.slug;
    }
    get settings() {
        return this.props.settings;
    }
    get status() {
        return this.props.status;
    }
    get healthScore() {
        return this.props.healthScore;
    }
    get metrics() {
        return this.props.metrics;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            name: this.props.name,
            ruc: this.props.ruc,
            slug: this.props.slug,
            settings: this.props.settings,
            status: this.props.status,
            healthScore: this.props.healthScore,
            metrics: this.props.metrics,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
}
//# sourceMappingURL=organization.entity.js.map