/**
 * ElectoralActRepository — Port interface for ElectoralAct persistence
 *
 * Framework-free interface following hexagonal architecture
 */

import type { ElectoralAct } from "../entity/ElectoralAct";

export interface ElectoralActRepository {
	findById(id: string): Promise<ElectoralAct | null>;
	findByStation(stationId: string): Promise<ElectoralAct[]>;
	findByStatus(status: string): Promise<ElectoralAct[]>;
	save(act: ElectoralAct): Promise<void>;
}
