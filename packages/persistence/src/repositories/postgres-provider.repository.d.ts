import type { CreateProviderDTO, Provider, ProviderFilters, ProviderRepository, UpdateProviderDTO } from "@drenyra/domain/repositories/provider.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresProviderRepository implements ProviderRepository {
    save(data: CreateProviderDTO): Promise<Provider>;
    update(id: string, data: UpdateProviderDTO): Promise<Provider>;
    delete(id: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<Provider | null>;
    findAll(organizationId: number, filters?: ProviderFilters): Promise<Provider[]>;
    count(organizationId: number, filters?: ProviderFilters): Promise<number>;
    findByRUC(organizationId: number, ruc: string): Promise<Provider | null>;
    private findProviderContext;
    private mapToProvider;
}
//# sourceMappingURL=postgres-provider.repository.d.ts.map