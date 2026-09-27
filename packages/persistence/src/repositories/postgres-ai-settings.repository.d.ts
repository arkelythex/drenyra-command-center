import { AISettings } from "@drenyra/domain/entities/AISettings";
import type { AISettingsRepository } from "@drenyra/domain/repositories/ai-settings.repository";
export declare class PostgresAISettingsRepository implements AISettingsRepository {
    findByUserId(userId: string): Promise<AISettings | null>;
    save(settings: AISettings): Promise<AISettings>;
    delete(userId: string): Promise<void>;
    private mapToDomain;
}
//# sourceMappingURL=postgres-ai-settings.repository.d.ts.map