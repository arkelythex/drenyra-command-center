import type { IOSEProvider, OSEConfig, OSEResponse, SendInvoiceData } from "../types";
export declare class NubeFactProvider implements IOSEProvider {
    private config;
    constructor(config: OSEConfig);
    send(data: SendInvoiceData): Promise<OSEResponse>;
    checkStatus(): Promise<{
        online: boolean;
        message: string;
    }>;
    private parseCdrStatus;
}
//# sourceMappingURL=nubefact.provider.d.ts.map