import { db } from '@arkelythex/persistence/client';
import { chatSessions, messages } from '@arkelythex/persistence/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * Postgres-backed repository for chat sessions and messages.
 *
 * @example
 * ```ts
 * const repo = new PostgresChatRepository();
 * const sessions = await repo.getSessionsByUser("user_123");
 * ```
 */
export class PostgresChatRepository {
  async getSessionsByUser(userId: string) {
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

  async addMessage(sessionId: string, role: string, content: string) {
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

  async createSession(userId: string, title?: string) {
    const [session] = await db
      .insert(chatSessions)
      .values({
        userId,
        title: title || 'New Chat',
      })
      .returning();

    return session;
  }

  async getHistory(sessionId: string) {
    return await db.query.messages.findMany({
      where: eq(messages.sessionId, sessionId),
      orderBy: [desc(messages.createdAt)],
    });
  }

  async getUserSessions(userId: string) {
    return await this.getSessionsByUser(userId);
  }
}
