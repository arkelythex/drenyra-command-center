export declare class PostgresChatRepository {
    getSessionsByUser(userId: string): Promise<{
        id: string;
        title: string;
        lastMessage: string | undefined;
        updatedAt: Date;
    }[]>;
    addMessage(sessionId: string, role: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        role: string;
        sessionId: string;
        content: string;
        metadata: unknown;
    } | undefined>;
    createSession(userId: string, title?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string | null;
        userId: string;
        title: string | null;
    } | undefined>;
    getHistory(sessionId: string): Promise<{
        id: string;
        createdAt: Date;
        role: string;
        sessionId: string;
        content: string;
        metadata: unknown;
    }[]>;
    getUserSessions(userId: string): Promise<{
        id: string;
        title: string;
        lastMessage: string | undefined;
        updatedAt: Date;
    }[]>;
}
//# sourceMappingURL=chat.repository.d.ts.map