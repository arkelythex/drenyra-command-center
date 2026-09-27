import type { AuditEventType, FiscalScope } from "../../drenyra/types";
import type { AuditEventPrimitiveData, AuditEventProps } from "./types";
export declare class AuditEvent {
    private props;
    private constructor();
    static create(props: AuditEventProps): AuditEvent;
    static fromPrimitives(data: AuditEventPrimitiveData): AuditEvent;
    equals(other: AuditEvent | null | undefined): boolean;
    get id(): string;
    get caseId(): string | undefined;
    get scope(): FiscalScope;
    get eventType(): AuditEventType;
    get actorId(): string;
    get message(): string;
    get occurredAt(): Date;
    get metadata(): Record<string, unknown>;
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=audit-event.entity.d.ts.map