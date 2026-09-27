import type { FiscalPolicyToolMapping, FiscalToolFamily } from "./fiscal-policy.types";
export declare const FISCAL_TOOL_POLICY_MAPPINGS: readonly FiscalPolicyToolMapping[];
export declare const getFiscalToolFamily: (toolName: string) => FiscalToolFamily | null;
export declare const resolveFiscalToolMapping: (toolName: string) => FiscalPolicyToolMapping | null;
export declare const isUnmappedFiscalTool: (toolName: string) => boolean;
//# sourceMappingURL=fiscal-policy-rules.d.ts.map