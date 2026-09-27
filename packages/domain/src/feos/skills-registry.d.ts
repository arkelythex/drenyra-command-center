import type { Actor, FiscalScope, Timestamp } from "./types";
import type { ToolRiskLevel } from "./tool-contract";
export type SkillExecutionMode = "manual" | "scheduled" | "event_triggered" | "continuous";
export interface SkillRegistryEntry {
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    author: string;
    riskLevel: ToolRiskLevel;
    executionMode: SkillExecutionMode;
    requiredCapabilities: string[];
    enabled: boolean;
    tags: string[];
    skillPath?: string;
    metadata?: Record<string, unknown>;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export type AutomationTriggerType = "schedule" | "event" | "webhook";
export type AutomationStatus = "active" | "paused" | "disabled" | "error";
export interface AutomationTrigger {
    type: AutomationTriggerType;
    cron?: string;
    eventType?: string;
    webhookUrl?: string;
    config?: Record<string, unknown>;
}
export interface AutomationProps {
    id: string;
    name: string;
    description: string;
    skillId: string;
    trigger: AutomationTrigger;
    status: AutomationStatus;
    riskLevel: ToolRiskLevel;
    scope: FiscalScope;
    createdBy: Actor;
    params?: Record<string, unknown>;
    notifyOnFailure?: string[];
    maxRetries: number;
    lastExecutedAt?: Timestamp;
    lastError?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
export declare class Automation {
    private readonly props;
    private constructor();
    static create(input: {
        name: string;
        description: string;
        skillId: string;
        trigger: AutomationTrigger;
        riskLevel: ToolRiskLevel;
        scope: FiscalScope;
        createdBy: Actor;
        params?: Record<string, unknown>;
        notifyOnFailure?: string[];
        maxRetries?: number;
    }): Automation;
    static fromProps(props: AutomationProps): Automation;
    get id(): string;
    get name(): string;
    get status(): AutomationStatus;
    get skillId(): string;
    get trigger(): AutomationTrigger;
    get lastExecutedAt(): Timestamp | undefined;
    get lastError(): string | undefined;
    pause(): Automation;
    activate(): Automation;
    disable(): Automation;
    recordExecution(): Automation;
    recordError(error: string): Automation;
    toProps(): AutomationProps;
}
export interface SkillsRegistry {
    register(skill: SkillRegistryEntry): Promise<void>;
    get(name: string): Promise<SkillRegistryEntry | null>;
    list(filter?: SkillFilter): Promise<SkillRegistryEntry[]>;
    findByCapability(capability: string): Promise<SkillRegistryEntry[]>;
}
export interface SkillFilter {
    category?: string;
    riskLevel?: ToolRiskLevel;
    enabled?: boolean;
    tags?: string[];
}
export interface AutomationStore {
    create(automation: Automation): Promise<void>;
    get(id: string): Promise<Automation | null>;
    update(automation: Automation): Promise<void>;
    list(filter?: {
        status?: AutomationStatus;
        skillId?: string;
    }): Promise<Automation[]>;
    listDue(): Promise<Automation[]>;
}
//# sourceMappingURL=skills-registry.d.ts.map