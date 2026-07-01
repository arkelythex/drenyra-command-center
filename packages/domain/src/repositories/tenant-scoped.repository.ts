export interface TenantScopedRepository<
	T,
	ID,
	Filters = Record<string, unknown>,
> {
	findById(id: ID): Promise<T | null>;
	findAll(filters?: Filters): Promise<T[]>;
	count(filters?: Filters): Promise<number>;
	save(entity: T): Promise<T>;
	update(entity: T): Promise<T>;
	delete(id: ID): Promise<void>;

	saveForOrganization(entity: T, organizationId: string): Promise<T>;
	findForOrganization(organizationId: string, filters?: Filters): Promise<T[]>;
	countForOrganization(
		organizationId: string,
		filters?: Filters,
	): Promise<number>;
	deleteForOrganization(id: ID, organizationId: string): Promise<void>;
}
