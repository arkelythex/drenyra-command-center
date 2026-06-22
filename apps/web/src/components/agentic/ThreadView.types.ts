import type { ApprovalRequest } from "@/stores/diff-approval-store";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ToolCall {
  id: string;
  name: string;
  status: "running" | "completed" | "error";
  output?: string;
  exitCode?: number;
  error?: string;
  entityType?: string;
  entityId?: string;
}

export interface DiffHunk {
  oldStart: number;
  newStart: number;
  content: string;
}

export interface DiffBlock {
  filePath: string;
  hunks: DiffHunk[];
}

export interface Message {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  diffs?: DiffBlock[];
  status?: "streaming" | "complete" | "error";
  approvalRequest?: ApprovalRequest;
}

export interface ThreadViewProps {
  messages?: Message[];
  isStreaming?: boolean;
  loadingHistory?: boolean;
}
