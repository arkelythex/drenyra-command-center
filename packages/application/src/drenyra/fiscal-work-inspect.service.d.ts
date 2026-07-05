import { type DrenyraFiscalWorkInspectRequest, type DrenyraFiscalWorkInspectResult } from "@drenyra/domain/drenyra";
import type { DrenyraRepository } from "./repository";
export declare class DrenyraFiscalWorkInspectService {
    private readonly repository;
    private readonly createTraceId;
    constructor(repository: DrenyraRepository, createTraceId?: () => string);
    inspect(request: DrenyraFiscalWorkInspectRequest): Promise<DrenyraFiscalWorkInspectResult>;
}
//# sourceMappingURL=fiscal-work-inspect.service.d.ts.map