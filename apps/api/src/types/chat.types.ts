export interface ChatMessage {
  sessionId?: string;
  message: string;
  images?: string[];
  context?: string;
}

export interface CreateChatSession {
  userId: string;
  title?: string;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
}
