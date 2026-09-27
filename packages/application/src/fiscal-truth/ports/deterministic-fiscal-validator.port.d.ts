import type { DeterministicValidatorResultRecord } from "@drenyra/domain";
export interface DeterministicFiscalValidatorPort {
    validate(input: unknown): Promise<DeterministicValidatorResultRecord>;
}
//# sourceMappingURL=deterministic-fiscal-validator.port.d.ts.map