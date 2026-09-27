import type { ModelRegistration } from "@drenyra/ai/providers/model-router-types";
import type { CapabilityScoringParams, ModelFilters, ModelRegistrationRepository } from "@drenyra/domain/repositories/model-registration.repository";
export declare class PostgresModelRegistrationRepository implements ModelRegistrationRepository {
    save(model: ModelRegistration): Promise<ModelRegistration>;
    update(model: ModelRegistration): Promise<ModelRegistration>;
    findById(id: string): Promise<ModelRegistration | null>;
    findAll(filters?: ModelFilters): Promise<ModelRegistration[]>;
    findByCapability(capability: string): Promise<ModelRegistration[]>;
    findOptimalForCapability(capability: string, scoring: CapabilityScoringParams): Promise<ModelRegistration | null>;
    delete(id: string): Promise<void>;
}
//# sourceMappingURL=model-registration.repository.d.ts.map