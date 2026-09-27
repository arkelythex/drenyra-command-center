import type { Client, ClientFilters, ClientRepository, CreateClientDTO, UpdateClientDTO } from "@drenyra/domain/repositories/client.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresClientRepository implements ClientRepository {
    save(data: CreateClientDTO): Promise<Client>;
    update(id: string, data: UpdateClientDTO): Promise<Client>;
    delete(id: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<Client | null>;
    findAll(organizationId: number, filters?: ClientFilters): Promise<Client[]>;
    count(organizationId: number, filters?: ClientFilters): Promise<number>;
    findByDocumentNumber(organizationId: number, documentNumber: string): Promise<Client | null>;
    private findClientContext;
    private mapToClient;
}
//# sourceMappingURL=postgres-client.repository.d.ts.map