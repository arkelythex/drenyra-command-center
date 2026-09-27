import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { EvidenceDTO } from "./dtos";
import type { GetEvidenceByIdQuery } from "./queries";
export declare class GetEvidenceHandler {
    private readonly evidenceRepository;
    constructor(evidenceRepository: EvidenceRepository);
    execute(query: GetEvidenceByIdQuery): Promise<EvidenceDTO | null>;
}
//# sourceMappingURL=get-evidence.handler.d.ts.map