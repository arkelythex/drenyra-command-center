export interface AISettingsProps {
    id: number;
    userId: string;
    customSystemIndicator: string | null;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const AI_SETTINGS_MAX_CHARS = 2000;
export declare class AISettings {
    private props;
    private constructor();
    static create(props: AISettingsProps): AISettings;
    static createNew(userId: string, customSystemIndicator?: string, isEnabled?: boolean): AISettings;
    private validateBusinessRules;
    setCustomSystemIndicator(value: string | null): AISettings;
    enable(): AISettings;
    disable(): AISettings;
    toggle(): AISettings;
    getEffectiveSystemIndicator(): string | null;
    hasCustomIndicator(): boolean;
    getCharacterCount(): number;
    getRemainingCharacters(): number;
    equals(other: AISettings | null | undefined): boolean;
    get id(): number;
    get userId(): string;
    get customSystemIndicator(): string | null;
    get isEnabled(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    toJSON(): Record<string, unknown>;
    getProps(): Readonly<AISettingsProps>;
}
//# sourceMappingURL=AISettings.d.ts.map