/**
 * Multi-Tenant Agent Memory — Per-organization learning store.
 * Each org has its own correction history, vendor patterns, and preferences.
 * Builds on MatchHistoryStore with organization scoping and persistence.
 */

export interface OrgMemoryEntry {
	orgId: number;
	key: string;
	value: unknown;
	createdAt: Date;
	updatedAt: Date;
}

export interface VendorLearning {
	orgId: number;
	vendorTaxId: string;
	vendorName: string;
	preferredAccount: string;
	descriptionPatterns: string[];
	matchCount: number;
	approvalRate: number;
	lastMatchedAt: Date;
}

export class OrgMemoryStore {
	private memory = new Map<string, OrgMemoryEntry[]>();
	private vendorMemory = new Map<string, VendorLearning[]>();

	async savePreference(
		orgId: number,
		key: string,
		value: unknown,
	): Promise<void> {
		const orgKey = `${orgId}`;
		if (!this.memory.has(orgKey)) this.memory.set(orgKey, []);
		const entries = this.memory.get(orgKey)!;

		const existing = entries.find((e) => e.key === key);
		if (existing) {
			existing.value = value;
			existing.updatedAt = new Date();
		} else {
			entries.push({
				orgId,
				key,
				value,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}
	}

	async getPreference<T>(orgId: number, key: string): Promise<T | undefined> {
		const entry = this.memory.get(`${orgId}`)?.find((e) => e.key === key);
		return entry?.value as T | undefined;
	}

	async getVendorPattern(
		orgId: number,
		taxId: string,
	): Promise<VendorLearning | undefined> {
		return this.vendorMemory
			.get(`${orgId}`)
			?.find((v) => v.vendorTaxId === taxId);
	}

	async recordVendorMatch(
		orgId: number,
		vendor: Omit<VendorLearning, "orgId">,
	): Promise<void> {
		const orgKey = `${orgId}`;
		if (!this.vendorMemory.has(orgKey)) this.vendorMemory.set(orgKey, []);
		const vendors = this.vendorMemory.get(orgKey)!;

		const existing = vendors.find((v) => v.vendorTaxId === vendor.vendorTaxId);
		if (existing) {
			existing.matchCount++;
			existing.approvalRate = vendor.approvalRate;
			existing.lastMatchedAt = new Date();
			existing.descriptionPatterns = [
				...new Set([
					...existing.descriptionPatterns,
					...vendor.descriptionPatterns,
				]),
			].slice(0, 20);
		} else {
			vendors.push({ orgId, ...vendor });
		}
	}
}
