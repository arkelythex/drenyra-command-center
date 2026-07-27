# SDD-WB-007 — Real-Time Agent Event Streaming

**Wave:** B (Agent Awareness)
**Status:** 🎯 partially implemented in WB-006 PR5

The SSE bridge (useAgentStreamBridge.ts) and demo hooks were built as part of SDD-WB-006 PR5. This SDD formalizes the real-time protocol between Pi backend and Workbench frontend.

**Existing implementation:** `hooks/useAgentStreamBridge.ts`, `hooks/useDemoAgentActivity.ts`, reuse of `features/intelligence/hooks/useAgentStream.ts`
**Pending:** WebSocket fallback, reconnection strategy with exponential backoff, event schema contract
