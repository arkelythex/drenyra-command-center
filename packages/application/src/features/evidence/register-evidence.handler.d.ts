import type { EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { RegisterEvidenceCommand } from "./commands";
import type { EvidenceDTO } from "./dtos";
export declare class RegisterEvidenceHandler {
    private readonly evidenceRepository;
    constructor(evidenceRepository: EvidenceRepository);
    execute(command: RegisterEvidenceCommand): Promise<EvidenceDTO>;
    private toDTO;
}
//# sourceMappingURL=register-evidence.handler.d.ts.map