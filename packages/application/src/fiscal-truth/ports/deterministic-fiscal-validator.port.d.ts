import type { DeterministicValidatorResultRecord } from "@arkelythex/domain";
export interface DeterministicFiscalValidatorPort {
    validate(input: unknown): Promise<DeterministicValidatorResultRecord>;
}
//# sourceMappingURL=deterministic-fiscal-validator.port.d.ts.map