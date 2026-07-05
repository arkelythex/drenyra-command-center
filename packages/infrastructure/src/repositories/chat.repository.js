import { db } from '@drenyra/persistence/client';
import { chatSessions, messages } from '@drenyra/persistence/schema';
import { eq, desc } from 'drizzle-orm';
export class PostgresChatRepository {
    async getSessionsByUser(userId) {
        const results = await db.query.chatSessions.findMany({
            where: eq(chatSessions.userId, userId),
            with: {
                messages: {
                    orderBy: [desc(messages.createdAt)],
                    limit: 10,
                },
            },
            orderBy: [desc(chatSessions.updatedAt)],
        });
        return results.map((session) => ({
            id: session.id,
            title: session.title || 'Untitled',
            lastMessage: session.messages[0]?.content,
            updatedAt: session.updatedAt,
        }));
    }
    async addMessage(sessionId, role, content) {
        const [message] = await db
            .insert(messages)
            .values({
            sessionId,
            role,
            content,
        })
            .returning();
        return message;
    }
    async createSession(userId, title) {
        const [session] = await db
            .insert(chatSessions)
            .values({
            userId,
            title: title || 'New Chat',
        })
            .returning();
        return session;
    }
    async getHistory(sessionId) {
        return await db.query.messages.findMany({
            where: eq(messages.sessionId, sessionId),
            orderBy: [desc(messages.createdAt)],
        });
    }
    async getUserSessions(userId) {
        return await this.getSessionsByUser(userId);
    }
}
//# sourceMappingURL=chat.repository.js.map