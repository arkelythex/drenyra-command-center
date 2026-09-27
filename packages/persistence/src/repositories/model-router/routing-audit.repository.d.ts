import type { ModelCapability, RoutingResult } from "@drenyra/ai/providers/model-router-types";
import type { RoutingAuditLogRepository } from "@drenyra/domain/repositories/model-registration.repository";
export declare class PostgresRoutingAuditLogRepository implements RoutingAuditLogRepository {
    save(entry: RoutingResult): Promise<void>;
    findByRequestId(requestId: string): Promise<RoutingResult[]>;
    findByCapability(capability: ModelCapability, since: Date): Promise<RoutingResult[]>;
}
//# sourceMappingURL=routing-audit.repository.d.ts.map