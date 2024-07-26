/**
 * FEOS-011 — Skills and Automation Registry
 *
 * Canonical domain model for skills (fiscal procedures) and automations
 * (triggered workflows). Extends the existing Skill entity with FEOS-level
 * registry, automation scheduling, and lifecycle management.
 *
 * A Skill is an executable procedure (fiscal or operational).
 * An Automation is a scheduled or event-triggered execution of a skill.
 *
 * @module @drenyra/domain/feos/skills-registry
 */

import type { Actor, FiscalScope, Timestamp } from "./types";
import { FeosError, generateId, nowTimestamp } from "./types";
import type { ToolRiskLevel } from "./tool-contract";

// ============================================================================
// Skill Metadata (extends existing Skill entity)
// ============================================================================

export type SkillExecutionMode = "manual" | "scheduled" | "event_triggered" | "continuous";

export interface SkillRegistryEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  /** Risk level of this skill when executed. */
  riskLevel: ToolRiskLevel;
  /** How this skill is typically executed. */
  executionMode: SkillExecutionMode;
  /** Required capabilities to execute this skill. */
  requiredCapabilities: string[];
  /** Whether this skill is available for use. */
  enabled: boolean;
  /** Tags for discovery. */
  tags: string[];
  /** Full path to the skill definition. */
  skillPath?: string;
  /** Metadata. */
  metadata?: Record<string, unknown>;
  /** Timestamps. */
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// Automation — scheduled or event-triggered skill execution
// ============================================================================

export type AutomationTriggerType = "schedule" | "event" | "webhook";
export type AutomationStatus = "active" | "paused" | "disabled" | "error";

export interface AutomationTrigger {
  type: AutomationTriggerType;
  /** Cron expression for scheduled triggers. */
  cron?: string;
  /** Event type for event triggers. */
  eventType?: string;
  /** Webhook URL for webhook triggers. */
  webhookUrl?: string;
  /** Trigger configuration. */
  config?: Record<string, unknown>;
}

export interface AutomationProps {
  id: string;
  name: string;
  description: string;
  /** The skill to execute. */
  skillId: string;
  /** The trigger configuration. */
  trigger: AutomationTrigger;
  /** Status of the automation. */
  status: AutomationStatus;
  /** Risk level (inherited from skill). */
  riskLevel: ToolRiskLevel;
  /** Fiscal scope for execution. */
  scope: FiscalScope;
  /** Who created the automation. */
  createdBy: Actor;
  /** Execution parameters. */
  params?: Record<string, unknown>;
  /** Notification recipients on failure. */
  notifyOnFailure?: string[];
  /** Maximum retries on failure. */
  maxRetries: number;
  /** Last execution timestamp. */
  lastExecutedAt?: Timestamp;
  /** Last error message. */
  lastError?: string;
  /** Timestamps. */
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class Automation {
  private constructor(private readonly props: AutomationProps) {
    Object.freeze(this);
  }

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
  }): Automation {
    const now = nowTimestamp();
    return new Automation({
      id: generateId(),
      name: input.name,
      description: input.description,
      skillId: input.skillId,
      trigger: input.trigger,
      status: "active",
      riskLevel: input.riskLevel,
      scope: input.scope,
      createdBy: input.createdBy,
      params: input.params,
      notifyOnFailure: input.notifyOnFailure,
      maxRetries: input.maxRetries ?? 3,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromProps(props: AutomationProps): Automation {
    return new Automation(props);
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get status(): AutomationStatus { return this.props.status; }
  get skillId(): string { return this.props.skillId; }
  get trigger(): AutomationTrigger { return this.props.trigger; }
  get lastExecutedAt(): Timestamp | undefined { return this.props.lastExecutedAt; }
  get lastError(): string | undefined { return this.props.lastError; }

  pause(): Automation {
    return new Automation({ ...this.props, status: "paused", updatedAt: nowTimestamp() });
  }

  activate(): Automation {
    return new Automation({ ...this.props, status: "active", updatedAt: nowTimestamp() });
  }

  disable(): Automation {
    return new Automation({ ...this.props, status: "disabled", updatedAt: nowTimestamp() });
  }

  recordExecution(): Automation {
    return new Automation({
      ...this.props,
      lastExecutedAt: nowTimestamp(),
      lastError: undefined,
      updatedAt: nowTimestamp(),
    });
  }

  recordError(error: string): Automation {
    return new Automation({
      ...this.props,
      status: "error",
      lastError: error,
      updatedAt: nowTimestamp(),
    });
  }

  toProps(): AutomationProps {
    return { ...this.props };
  }
}

// ============================================================================
// Skills Registry Store Interface
// ============================================================================

export interface SkillsRegistry {
  /** Register or update a skill entry. */
  register(skill: SkillRegistryEntry): Promise<void>;
  /** Get a skill by name. */
  get(name: string): Promise<SkillRegistryEntry | null>;
  /** List all skills matching filter. */
  list(filter?: SkillFilter): Promise<SkillRegistryEntry[]>;
  /** Find skills by capability. */
  findByCapability(capability: string): Promise<SkillRegistryEntry[]>;
}

export interface SkillFilter {
  category?: string;
  riskLevel?: ToolRiskLevel;
  enabled?: boolean;
  tags?: string[];
}

// ============================================================================
// Automation Store Interface
// ============================================================================

export interface AutomationStore {
  create(automation: Automation): Promise<void>;
  get(id: string): Promise<Automation | null>;
  update(automation: Automation): Promise<void>;
  list(filter?: { status?: AutomationStatus; skillId?: string }): Promise<Automation[]>;
  listDue(): Promise<Automation[]>;
}
