import type {
	AgentRunOutput,
	AgentRunStatus,
	DrenyraAgentType,
	FiscalScope,
} from "../../drenyra/types";
import type { AgentRunPrimitiveData, AgentRunProps } from "./types";
import { validateAgentRunProps } from "./validators";

export class AgentRun {
	private constructor(private props: AgentRunProps) {
		validateAgentRunProps(this.props);
		Object.freeze(this);
	}

	static create(props: AgentRunProps): AgentRun {
		return new AgentRun(props);
	}

	static fromPrimitives(data: AgentRunPrimitiveData): AgentRun {
		const props: AgentRunProps = {
			id: data.id,
			caseId: data.caseId,
			scope: {
				companyId: data.scope.companyId,
				companyRuc: data.scope.companyRuc,
				...(data.scope.organizationId !== undefined
					? { organizationId: data.scope.organizationId }
					: {}),
				period: data.scope.period,
				countryCode: data.scope.countryCode as "PE",
			},
			agentType: data.agentType as DrenyraAgentType,
			status: data.status as AgentRunStatus,
			startedBy: data.startedBy,
			startedAt:
				data.startedAt instanceof Date
					? data.startedAt
					: new Date(data.startedAt),
			...(data.completedAt
				? data.completedAt instanceof Date
					? { completedAt: data.completedAt }
					: { completedAt: new Date(data.completedAt) }
				: {}),
			...(data.output !== undefined ? { output: data.output } : {}),
			metadata: data.metadata ?? {},
			updatedAt: data.updatedAt
				? data.updatedAt instanceof Date
					? data.updatedAt
					: new Date(data.updatedAt)
				: new Date(),
		};
		return new AgentRun(props);
	}

	complete(output: AgentRunOutput): AgentRun {
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

	fail(error?: string): AgentRun {
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

	equals(other: AgentRun | null | undefined): boolean {
		if (!other) return false;
		return this.props.id === other.props.id;
	}

	get id(): string {
		return this.props.id;
	}
	get caseId(): string {
		return this.props.caseId;
	}
	get scope(): FiscalScope {
		return this.props.scope;
	}
	get agentType(): DrenyraAgentType {
		return this.props.agentType;
	}
	get status(): AgentRunStatus {
		return this.props.status;
	}
	get startedBy(): string {
		return this.props.startedBy;
	}
	get startedAt(): Date {
		return this.props.startedAt;
	}
	get completedAt(): Date | undefined {
		return this.props.completedAt;
	}
	get output(): AgentRunOutput | undefined {
		return this.props.output;
	}
	get metadata(): Record<string, unknown> {
		return { ...this.props.metadata };
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}

	toJSON(): Record<string, unknown> {
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
