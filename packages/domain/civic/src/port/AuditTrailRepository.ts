/**
 * AuditTrailRepository — Port interface for AuditTrail persistence
 *
 * Framework-free interface following hexagonal architecture
 */

import type { AuditTrail } from "../entity/AuditTrail";

export interface AuditTrailRepository {
	findById(id: string): Promise<AuditTrail | null>;
	findByAct(actId: string): Promise<AuditTrail[]>;
	save(entry: AuditTrail): Promise<void>;
}
