export interface Client {
    id: string;
    organizationId: number;
    name: string;
    documentType: "RUC" | "DNI" | "CE";
    documentNumber: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: string;
    creditDays?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ClientFilters {
    name?: string;
    documentType?: "RUC" | "DNI" | "CE";
    documentNumber?: string;
    email?: string;
}
export interface CreateClientDTO {
    organizationId: number;
    name: string;
    documentType: "RUC" | "DNI" | "CE";
    documentNumber: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: string;
    creditDays?: number;
}
export interface UpdateClientDTO {
    name?: string;
    documentType?: "RUC" | "DNI" | "CE";
    documentNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
    creditLimit?: string;
    creditDays?: number;
}
export interface ClientRepository {
    save(data: CreateClientDTO): Promise<Client>;
    update(id: string, data: UpdateClientDTO): Promise<Client>;
    delete(id: string): Promise<void>;
    findById(scope: import("../scope").TenantScope, id: string): Promise<Client | null>;
    findAll(organizationId: number, filters?: ClientFilters): Promise<Client[]>;
    count(organizationId: number, filters?: ClientFilters): Promise<number>;
    findByDocumentNumber(organizationId: number, documentNumber: string): Promise<Client | null>;
}
//# sourceMappingURL=client.repository.d.ts.map