/**
 * Civic Application Port Interfaces
 *
 * Framework-free interfaces for external dependencies.
 * Infrastructure adapters implement these ports.
 */
import type { FraudIndicator } from "@arkelythex/domain-civic";

export interface IElectoralRollVerifier {
	/** Verify a voter's DNI against the electoral roll */
	verify(dni: string, electionId: string): Promise<boolean>;
}

export interface IFraudRuleEngine {
	/** Analyze electoral acts for fraud patterns */
	analyze(acts: unknown[], allActs: unknown[]): Promise<FraudIndicator[]>;
}

export interface IAuditEvidenceStore {
	/** Store audit evidence and return its hash */
	store(content: string, type: string): Promise<string>;
	/** Retrieve audit evidence by hash */
	retrieve(hash: string): Promise<string | null>;
}

export interface IDigitalPublicPeruBridge {
	/** Query DNI verification from Digital Public Peru */
	queryDni(dni: string): Promise<{
		dni: string;
		fullName: string;
		isValid: boolean;
		verifiedAt: string;
	} | null>;
}
