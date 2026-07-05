export declare class PostgresChatRepository {
	getSessionsByUser(userId: string): Promise<
		{
			id: string;
			title: string;
			lastMessage: string;
			updatedAt: Date;
		}[]
	>;
	addMessage(
		sessionId: string,
		role: string,
		content: string,
	): Promise<{
		role: string;
		id: string;
		metadata: unknown;
		createdAt: Date;
		sessionId: string;
		content: string;
	}>;
	createSession(
		userId: string,
		title?: string,
	): Promise<{
		companyId: string | null;
		userId: string;
		id: string;
		createdAt: Date;
		updatedAt: Date;
		title: string | null;
	}>;
	getHistory(sessionId: string): Promise<
		{
			role: string;
			id: string;
			metadata: unknown;
			createdAt: Date;
			sessionId: string;
			content: string;
		}[]
	>;
	getUserSessions(userId: string): Promise<
		{
			id: string;
			title: string;
			lastMessage: string;
			updatedAt: Date;
		}[]
	>;
}
//# sourceMappingURL=chat.repository.d.ts.map
