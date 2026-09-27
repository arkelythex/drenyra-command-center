export interface Provider {
    id: string;
    organizationId: number;
    name: string;
    ruc: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProviderFilters {
    name?: string;
    ruc?: string;
    email?: string;
}
export interface CreateProviderDTO {
    organizationId: number;
    name: string;
    ruc: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms?: number;
}
export interface UpdateProviderDTO {
    name?: string;
    ruc?: string;
    email?: string;
    phone?: string;
    address?: string;
    paymentTerms?: number;
}
export interface ProviderRepository {
    save(data: CreateProviderDTO): Promise<Provider>;
    update(id: string, data: UpdateProviderDTO): Promise<Provider>;
    delete(id: string): Promise<void>;
    findById(scope: import("../scope").TenantScope, id: string): Promise<Provider | null>;
    findAll(organizationId: number, filters?: ProviderFilters): Promise<Provider[]>;
    count(organizationId: number, filters?: ProviderFilters): Promise<number>;
    findByRUC(organizationId: number, ruc: string): Promise<Provider | null>;
}
//# sourceMappingURL=provider.repository.d.ts.map