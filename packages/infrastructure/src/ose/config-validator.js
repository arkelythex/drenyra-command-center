export class OSEConfigValidator {
    validate(config) {
        const missing = [];
        const errors = [];
        const isSimulation = config.provider === "simulation" || config.simulationMode === true;
        if (isSimulation) {
            return { valid: true, missing, errors };
        }
        if (!this.isValidString(config.apiToken)) {
            missing.push("OSE_API_TOKEN");
        }
        if (!this.isValidString(config.ruc)) {
            missing.push("COMPANY_RUC");
        }
        else if (!this.isValidRUC(config.ruc)) {
            errors.push("COMPANY_RUC debe tener 11 dígitos");
        }
        if (!this.isValidString(config.username)) {
            missing.push("OSE_USERNAME");
        }
        if (!this.isValidString(config.apiUrl)) {
            missing.push("OSE_API_URL");
        }
        return {
            valid: missing.length === 0 && errors.length === 0,
            missing,
            errors,
        };
    }
    isValidString(value) {
        return typeof value === "string" && value.trim().length > 0;
    }
    isValidRUC(ruc) {
        return /^\d{11}$/.test(ruc);
    }
}
export const oseConfigValidator = new OSEConfigValidator();
//# sourceMappingURL=config-validator.js.map