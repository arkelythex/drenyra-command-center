import type { IOSEProvider, OSEConfig, OSEResponse, SendInvoiceData } from "../types";
export declare class SimulationOSEProvider implements IOSEProvider {
    private readonly config;
    constructor(config: OSEConfig);
    send(data: SendInvoiceData): Promise<OSEResponse>;
    checkStatus(): Promise<{
        online: boolean;
        message: string;
    }>;
    private getOutcome;
    private buildCdrXml;
}
//# sourceMappingURL=simulation.provider.d.ts.map