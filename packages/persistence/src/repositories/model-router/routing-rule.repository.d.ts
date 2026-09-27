import type { CapabilityRoutingRule } from "@drenyra/ai/providers/model-router-types";
import type { CapabilityRoutingRuleRepository } from "@drenyra/domain/repositories/model-registration.repository";
export declare class PostgresCapabilityRoutingRuleRepository implements CapabilityRoutingRuleRepository {
    save(rule: CapabilityRoutingRule): Promise<CapabilityRoutingRule>;
    findByCapability(capability: string): Promise<CapabilityRoutingRule | null>;
    findAll(): Promise<CapabilityRoutingRule[]>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=routing-rule.repository.d.ts.map