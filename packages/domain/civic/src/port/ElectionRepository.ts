/**
 * ElectionRepository — Port interface for Election persistence
 *
 * Framework-free interface following hexagonal architecture
 */

import type { Election } from "../entity/Election";

export interface ElectionRepository {
	findById(id: string): Promise<Election | null>;
	findByRegion(region: string): Promise<Election[]>;
	findByStatus(status: string): Promise<Election[]>;
	save(election: Election): Promise<void>;
	delete(id: string): Promise<void>;
}
