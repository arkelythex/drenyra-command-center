import { validateAgentRunProps } from "./validators";
export class AgentRun {
    props;
    constructor(props) {
        this.props = props;
        validateAgentRunProps(this.props);
        Object.freeze(this);
    }
    static create(props) {
        return new AgentRun(props);
    }
    static fromPrimitives(data) {
        const props = {
            id: data.id,
            caseId: data.caseId,
            scope: {
                companyId: data.scope.companyId,
                companyRuc: data.scope.companyRuc,
                organizationId: data.scope.organizationId,
                period: data.scope.period,
                countryCode: data.scope.countryCode,
            },
            agentType: data.agentType,
            status: data.status,
            startedBy: data.startedBy,
            startedAt: data.startedAt instanceof Date
                ? data.startedAt
                : new Date(data.startedAt),
            completedAt: data.completedAt
                ? data.completedAt instanceof Date
                    ? data.completedAt
                    : new Date(data.completedAt)
                : undefined,
            output: data.output,
            metadata: data.metadata ?? {},
            updatedAt: data.updatedAt
                ? data.updatedAt instanceof Date
                    ? data.updatedAt
                    : new Date(data.updatedAt)
                : new Date(),
        };
        return new AgentRun(props);
    }
    complete(output) {
        if (this.props.status !== "STARTED") {
            throw new Error("Only STARTED agent runs can be completed");
        }
        return new AgentRun({
            ...this.props,
            status: "COMPLETED",
            completedAt: new Date(),
            output,
            updatedAt: new Date(),
        });
    }
    fail(error) {
        if (this.props.status !== "STARTED") {
            throw new Error("Only STARTED agent runs can fail");
        }
        return new AgentRun({
            ...this.props,
            status: "FAILED",
            completedAt: new Date(),
            metadata: error ? { ...this.props.metadata, error } : this.props.metadata,
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
    get caseId() {
        return this.props.caseId;
    }
    get scope() {
        return this.props.scope;
    }
    get agentType() {
        return this.props.agentType;
    }
    get status() {
        return this.props.status;
    }
    get startedBy() {
        return this.props.startedBy;
    }
    get startedAt() {
        return this.props.startedAt;
    }
    get completedAt() {
        return this.props.completedAt;
    }
    get output() {
        return this.props.output;
    }
    get metadata() {
        return { ...this.props.metadata };
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            caseId: this.props.caseId,
            scope: this.props.scope,
            agentType: this.props.agentType,
            status: this.props.status,
            startedBy: this.props.startedBy,
            startedAt: this.props.startedAt.toISOString(),
            completedAt: this.props.completedAt?.toISOString(),
            output: this.props.output,
            metadata: this.props.metadata,
        };
    }
}
//# sourceMappingURL=agent-run.entity.js.map