import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { EvidenceDTO } from "./dtos";
import type { ListPendingClassificationQuery } from "./queries";
export declare class ListPendingClassificationHandler {
    private readonly evidenceRepository;
    constructor(evidenceRepository: EvidenceRepository);
    execute(query: ListPendingClassificationQuery): Promise<EvidenceDTO[]>;
}
//# sourceMappingURL=list-pending.handler.d.ts.map