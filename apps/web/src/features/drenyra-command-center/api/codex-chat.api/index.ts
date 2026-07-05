// ─── Barrel — re-exports everything for backward compatibility ──
// Original: src/features/drenyra-command-center/api/codex-chat.api.ts (~298 lines)
// Split into: types, utils

export type * from "./types";

import type {
	DrenyraBrainItem,
	DrenyraBrainThread,
} from "@drenyra/domain/drenyra";
import { api } from "@/lib/api";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import type { ChatMessage, StreamChunk } from "./types";
import { chatHeaders, mockStreamResponse, parseSseStream } from "./utils";

export const codexChatApi = {
  async createMessageStream(
    threadId: string,
    message: string,
  ): Promise<AsyncGenerator<StreamChunk>> {
    try {
      const url = `/api/drenyra/chat/stream?message=${encodeURIComponent(message)}&sessionId=${encodeURIComponent(threadId)}`;
      const hdrs = chatHeaders();
      const response = await fetch(url, hdrs);

      if (response.ok && response.body) {
        return parseSseStream(response.body);
      }
    } catch {
      /* fall through to mock */
    }

    return mockStreamResponse(message);
  },

  async sendChatMessage(
    threadId: string,
    message: string,
  ): Promise<AsyncGenerator<StreamChunk>> {
    return codexChatApi.createMessageStream(threadId, message);
  },

  async getThreadHistory(
    threadId: string,
  ): Promise<ChatMessage[]> {
    try {
      const body = await unwrap(
        api.api.drenyra.brain.threads({ id: threadId }).items.get(chatHeaders()),
      );
      const items = extractOkData<DrenyraBrainItem[]>(body, "No items");
      return items.map((item, idx) => ({
        id: item.id ?? `${threadId}-item-${idx}`,
        role: (item.actorId ? "agent" : "user") as "user" | "agent",
        content:
          typeof item.content === "object" && "text" in item.content
            ? (item.content as { text: string }).text
            : "",
        timestamp: item.createdAt ?? new Date().toISOString(),
        status: "complete" as const,
      }));
    } catch {
      return [];
    }
  },

  async createChatThread(
    title: string,
  ): Promise<{ id: string; title: string; status: string; createdAt: string } | null> {
    try {
      const body = await unwrap(
        api.api.drenyra.brain.threads.post(
          { title, sourceSurface: "web" },
          chatHeaders(),
        ),
      );
      const thread = extractOkData<DrenyraBrainThread>(body, "No thread");
      return {
        id: thread.id,
        title: thread.title,
        status: thread.status,
        createdAt: thread.createdAt,
      };
    } catch {
      return null;
    }
  },

  async archiveChatThread(threadId: string): Promise<boolean> {
    try {
      const url = `/api/drenyra/brain/threads/${encodeURIComponent(threadId)}`;
      const hdrs = chatHeaders();
      const response = await fetch(url, {
        method: "DELETE",
        headers: hdrs.headers,
      });
      return response.ok || response.status === 204;
    } catch {
      return false;
    }
  },
};
