/**
 * CoreDomainRegistry — tracks which domains are active in the platform.
 *
 * Used by:
 * - Super Orchestrator to know which domains exist
 * - API Gateway to route requests
 * - Schema migration to know which schemas to create
 */

export interface DomainRegistration {
	name: string;
	schemaName: string;
	displayName: string;
	description?: string;
	isActive: boolean;
	registeredAt?: Date;
}

export class CoreDomainRegistry {
	private domains = new Map<string, DomainRegistration>();

	register(domain: DomainRegistration): void {
		this.domains.set(domain.name, {
			...domain,
			registeredAt: domain.registeredAt ?? new Date(),
		});
	}

	unregister(name: string): void {
		this.domains.delete(name);
	}

	getActiveDomains(): DomainRegistration[] {
		return Array.from(this.domains.values()).filter((d) => d.isActive);
	}

	getAll(): DomainRegistration[] {
		return Array.from(this.domains.values());
	}

	isRegistered(name: string): boolean {
		return this.domains.has(name);
	}

	get(name: string): DomainRegistration | undefined {
		return this.domains.get(name);
	}
}
