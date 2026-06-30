/**
 * CivicCaseRepository — Port interface for CivicCase persistence
 *
 * Framework-free interface following hexagonal architecture
 */

import type { CivicCase } from "../entity/CivicCase";

export interface CivicCaseRepository {
	findById(id: string): Promise<CivicCase | null>;
	findByStatus(status: string): Promise<CivicCase[]>;
	save(civicCase: CivicCase): Promise<void>;
	delete(id: string): Promise<void>;
}
