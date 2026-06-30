/**
 * FraudIndicatorRepository — Port interface for FraudIndicator persistence
 *
 * Framework-free interface following hexagonal architecture
 */

import type { FraudIndicator } from "../value-object/FraudIndicator";

export interface FraudIndicatorRepository {
	findById(id: string): Promise<FraudIndicator | null>;
	findByElection(electionId: string): Promise<FraudIndicator[]>;
	findBySeverity(severity: string): Promise<FraudIndicator[]>;
	save(indicator: FraudIndicator): Promise<void>;
}
