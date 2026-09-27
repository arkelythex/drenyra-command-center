export const AI_SETTINGS_MAX_CHARS = 2000;
export class AISettings {
    props;
    constructor(props) {
        this.props = props;
        this.validateBusinessRules();
    }
    static create(props) {
        return new AISettings(props);
    }
    static createNew(userId, customSystemIndicator, isEnabled = true) {
        const now = new Date();
        return new AISettings({
            id: 0,
            userId,
            customSystemIndicator: customSystemIndicator?.trim() || null,
            isEnabled,
            createdAt: now,
            updatedAt: now,
        });
    }
    validateBusinessRules() {
        if (!this.props.userId || this.props.userId.trim().length === 0) {
            throw new Error("El ID de usuario es requerido");
        }
        if (this.props.customSystemIndicator &&
            this.props.customSystemIndicator.length > AI_SETTINGS_MAX_CHARS) {
            throw new Error(`El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`);
        }
    }
    setCustomSystemIndicator(value) {
        const trimmedValue = value?.trim() || null;
        if (trimmedValue && trimmedValue.length > AI_SETTINGS_MAX_CHARS) {
            throw new Error(`El indicador del sistema no puede exceder ${AI_SETTINGS_MAX_CHARS} caracteres`);
        }
        return new AISettings({
            ...this.props,
            customSystemIndicator: trimmedValue,
            updatedAt: new Date(),
        });
    }
    enable() {
        if (this.props.isEnabled) {
            return this;
        }
        return new AISettings({
            ...this.props,
            isEnabled: true,
            updatedAt: new Date(),
        });
    }
    disable() {
        if (!this.props.isEnabled) {
            return this;
        }
        return new AISettings({
            ...this.props,
            isEnabled: false,
            updatedAt: new Date(),
        });
    }
    toggle() {
        return this.props.isEnabled ? this.disable() : this.enable();
    }
    getEffectiveSystemIndicator() {
        if (!this.props.isEnabled) {
            return null;
        }
        return this.props.customSystemIndicator;
    }
    hasCustomIndicator() {
        return (this.props.customSystemIndicator !== null &&
            this.props.customSystemIndicator.trim().length > 0);
    }
    getCharacterCount() {
        return this.props.customSystemIndicator?.length || 0;
    }
    getRemainingCharacters() {
        return AI_SETTINGS_MAX_CHARS - this.getCharacterCount();
    }
    equals(other) {
        if (!other)
            return false;
        return this.props.userId === other.props.userId;
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get customSystemIndicator() {
        return this.props.customSystemIndicator;
    }
    get isEnabled() {
        return this.props.isEnabled;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    toJSON() {
        return {
            id: this.props.id,
            userId: this.props.userId,
            customSystemIndicator: this.props.customSystemIndicator,
            isEnabled: this.props.isEnabled,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString(),
        };
    }
    getProps() {
        return { ...this.props };
    }
}
//# sourceMappingURL=AISettings.js.map