import type { Customer } from "./customer";

/**
 * CustomerSegment type.
 *
 * @example
 * ```ts
 * const value: CustomerSegment = {} as CustomerSegment;
 * console.log(value);
 * ```
 */
export type CustomerSegment = "RETAIL" | "WHOLESALE" | "GOVERNMENT";

/**
 * CreateCustomerInput interface.
 *
 * @example
 * ```ts
 * const value: CreateCustomerInput = {} as CreateCustomerInput;
 * console.log(value);
 * ```
 */
export interface CreateCustomerInput {
	companyId: string;
	taxId: string;
	legalName: string;
	email?: string;
	address?: string;
	phone?: string;
	creditLimit?: number;
	creditDays?: number;
	customerSegment?: CustomerSegment;
}

/**
 * UpdateCustomerInput interface.
 *
 * @example
 * ```ts
 * const value: UpdateCustomerInput = {} as UpdateCustomerInput;
 * console.log(value);
 * ```
 */
export interface UpdateCustomerInput {
	id: string;
	companyId: string;
	taxId?: string;
	legalName?: string;
	email?: string;
	address?: string;
	phone?: string;
	creditLimit?: number;
	creditDays?: number;
	customerSegment?: CustomerSegment;
}

/**
 * CustomerListFilters interface.
 *
 * @example
 * ```ts
 * const value: CustomerListFilters = {} as CustomerListFilters;
 * console.log(value);
 * ```
 */
export interface CustomerListFilters {
	companyId: string;
	includeInactive?: boolean;
	minPaymentScore?: number;
	segment?: CustomerSegment;
}

/**
 * ICustomerRepository interface.
 *
 * @example
 * ```ts
 * const value: ICustomerRepository = {} as ICustomerRepository;
 * console.log(value);
 * ```
 */
export interface ICustomerRepository {
	create(input: CreateCustomerInput): Promise<Customer>;
	update(input: UpdateCustomerInput): Promise<Customer>;
	softDelete(id: string, companyId: string): Promise<Customer>;
	findById(id: string): Promise<Customer | null>;
	findByIdForCompany(id: string, companyId: string): Promise<Customer | null>;
	list(filters: CustomerListFilters): Promise<Customer[]>;
	existsByTaxId(companyId: string, taxId: string): Promise<boolean>;
}
