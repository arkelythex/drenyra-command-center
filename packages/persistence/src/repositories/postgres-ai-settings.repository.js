import { eq } from "drizzle-orm";
import { AISettings } from "@arkelythex/domain/entities/AISettings";
import { db } from "@arkelythex/persistence/client";
import { userAISettings } from "@arkelythex/persistence/schema";
export class PostgresAISettingsRepository {
    async findByUserId(userId) {
        const result = await db
            .select()
            .from(userAISettings)
            .where(eq(userAISettings.userId, userId))
            .limit(1);
        if (!result[0])
            return null;
        return this.mapToDomain(result[0]);
    }
    async save(settings) {
        const props = settings.getProps();
        const result = await db
            .insert(userAISettings)
            .values({
            userId: props.userId,
            customSystemIndicator: props.customSystemIndicator,
            isEnabled: props.isEnabled,
            createdAt: props.createdAt,
            updatedAt: new Date(),
        })
            .onConflictDoUpdate({
            target: userAISettings.userId,
            set: {
                customSystemIndicator: props.customSystemIndicator,
                isEnabled: props.isEnabled,
                updatedAt: new Date(),
            },
        })
            .returning();
        if (!result[0]) {
            throw new Error("Failed to save AI settings");
        }
        return this.mapToDomain(result[0]);
    }
    async delete(userId) {
        await db.delete(userAISettings).where(eq(userAISettings.userId, userId));
    }
    mapToDomain(raw) {
        return AISettings.create({
            id: raw.id,
            userId: raw.userId,
            customSystemIndicator: raw.customSystemIndicator,
            isEnabled: raw.isEnabled,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
}
//# sourceMappingURL=postgres-ai-settings.repository.js.map