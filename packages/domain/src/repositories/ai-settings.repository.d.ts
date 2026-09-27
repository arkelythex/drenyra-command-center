import type { AISettings } from "../entities/AISettings";
export interface AISettingsRepository {
    findByUserId(userId: string): Promise<AISettings | null>;
    save(settings: AISettings): Promise<AISettings>;
    delete(userId: string): Promise<void>;
}
//# sourceMappingURL=ai-settings.repository.d.ts.map