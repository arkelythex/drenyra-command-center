import type { AgentRunOutput, AgentRunStatus, DrenyraAgentType, FiscalScope } from "../../drenyra/types";
import type { AgentRunPrimitiveData, AgentRunProps } from "./types";
export declare class AgentRun {
    private props;
    private constructor();
    static create(props: AgentRunProps): AgentRun;
    static fromPrimitives(data: AgentRunPrimitiveData): AgentRun;
    complete(output: AgentRunOutput): AgentRun;
    fail(error?: string): AgentRun;
    equals(other: AgentRun | null | undefined): boolean;
    get id(): string;
    get caseId(): string;
    get scope(): FiscalScope;
    get agentType(): DrenyraAgentType;
    get status(): AgentRunStatus;
    get startedBy(): string;
    get startedAt(): Date;
    get completedAt(): Date | undefined;
    get output(): AgentRunOutput | undefined;
    get metadata(): Record<string, unknown>;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=agent-run.entity.d.ts.map