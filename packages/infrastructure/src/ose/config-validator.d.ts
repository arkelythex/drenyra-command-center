import type { OSEConfig, ValidationResult } from "./types";
export declare class OSEConfigValidator {
    validate(config: OSEConfig): ValidationResult;
    private isValidString;
    private isValidRUC;
}
export declare const oseConfigValidator: OSEConfigValidator;
//# sourceMappingURL=config-validator.d.ts.map