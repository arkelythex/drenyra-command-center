"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Bot,
  User,
  Pin,
  PinOff,
  PanelRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useArtifactStore } from "@/stores/artifact-store";
import { useUIStore } from "@/store/ui-store";
import type { Message } from "./ThreadView.types";
import { ToolCallCard } from "./ThreadView.tool-call-card";
import { DiffView } from "./ThreadView.diff-view";
import { StreamingText } from "./ThreadView.streaming";
import { ApprovalCard } from "./ApprovalCard";
import {
  ArtifactRenderer,
} from "@/features/cognitive-hub/components/artifacts/ArtifactRenderer";
import {
  extractArtifacts,
  stripArtifacts,
} from "@/features/cognitive-hub/logic/artifact-extractor";
import type { HubArtifact } from "@/features/cognitive-hub/types/hub.types";

// ─── Message Bubble ─────────────────────────────────────────────────────────

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const isAgent = !isUser && !isSystem;

  const artifactCollapsed = useArtifactStore((s) => s.artifactCollapsed);
  const density = useArtifactStore((s) => s.density);
  const pinnedArtifacts = useArtifactStore((s) => s.pinnedArtifacts);
  const setArtifactCollapsed = useArtifactStore((s) => s.setArtifactCollapsed);
  const toggleArtifactCollapsed = useArtifactStore((s) => s.toggleArtifactCollapsed);
  const pinArtifact = useArtifactStore((s) => s.pinArtifact);
  const unpinArtifact = useArtifactStore((s) => s.unpinArtifact);
  const setActiveArtifactId = useArtifactStore((s) => s.setActiveArtifactId);
  const toggleRightRail = useUIStore((s) => s.toggleRightRail);
  const setRightPanelTab = useUIStore((s) => s.setRightPanelTab);

  const isCompact = density === "compact";

  // Extract artifacts from agent message content (non-streaming only)
  const { artifacts, displayContent } = useMemo(() => {
    if (isAgent && message.content && message.status !== "streaming") {
      return {
        artifacts: extractArtifacts(message.content),
        displayContent: stripArtifacts(message.content),
      };
    }
    return { artifacts: [] as HubArtifact[], displayContent: message.content };
  }, [isAgent, message.content, message.status]);

  const showArtifacts = artifacts.length > 0;

  // All artifacts start collapsed by default
  useEffect(() => {
    if (showArtifacts) {
      for (const a of artifacts) {
        if (artifactCollapsed[a.id] === undefined) {
          setArtifactCollapsed(a.id, true);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArtifacts]);

  const handlePin = useCallback(
    (artifact: HubArtifact) => {
      const isPinned = pinnedArtifacts.some((p) => p.id === artifact.id);
      if (isPinned) {
        unpinArtifact(artifact.id);
      } else {
        pinArtifact(artifact);
      }
    },
    [pinnedArtifacts, pinArtifact, unpinArtifact],
  );

  const handleMoveToPanel = useCallback(
    (artifact: HubArtifact) => {
      setActiveArtifactId(artifact.id);
      pinArtifact(artifact);
      setRightPanelTab("artifact");
      if (!useUIStore.getState().isRightRailOpen) {
        toggleRightRail();
      }
    },
    [pinArtifact, toggleRightRail, setRightPanelTab, setActiveArtifactId],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser && "bg-[var(--color-primary)]/10",
          isSystem && "bg-[var(--color-warning)]/10",
          isAgent && "bg-[var(--premium-info)]/10",
        )}
      >
        {isUser ? (
          <User size={14} className="text-[var(--color-primary)]" />
        ) : isSystem ? (
          <AlertCircle size={14} className="text-[var(--color-warning)]" />
        ) : (
          <Bot size={14} className="text-[var(--premium-info)]" />
        )}
      </div>

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-2",
          isUser && "items-end",
        )}
      >
        {message.approvalRequest && (
          <div className="w-full max-w-lg">
            <ApprovalCard request={message.approvalRequest} />
          </div>
        )}

        {/* Text bubble — uses displayContent (artifacts stripped) */}
        {displayContent && !message.approvalRequest && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isUser &&
                "rounded-br-sm bg-[var(--color-primary)]/10 text-[var(--text-primary)]",
              isAgent &&
                "rounded-bl-sm bg-[var(--surface-2)] text-[var(--text-primary)]",
              isSystem &&
                "rounded-bl-sm bg-[var(--color-warning)]/5 text-[var(--text-secondary)] italic",
              message.status === "error" && "border border-[var(--premium-danger)]/30",
            )}
          >
            <div className="whitespace-pre-wrap">
              {message.status === "streaming" ? (
                <StreamingText content={displayContent} status={message.status} />
              ) : (
                displayContent
              )}
            </div>
            {message.status === "error" && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--premium-danger)]">
                <AlertCircle size={12} />
                <span>Error al procesar la respuesta</span>
              </div>
            )}
          </div>
        )}

        {/* Inline rendered artifacts — collapsible with pin/move */}
        {showArtifacts && (
          <div className={cn("space-y-3", isCompact && "space-y-2")}>
            {artifacts.map((artifact) => {
              const collapsed = artifactCollapsed[artifact.id] ?? true;
              const isPinned = pinnedArtifacts.some(
                (p) => p.id === artifact.id,
              );
              return (
                <div
                  key={artifact.id}
                  className={cn(
                    "overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] transition-all",
                    collapsed && "hover:border-[var(--border-default)]",
                    isCompact && "rounded-lg",
                  )}
                >
                  {/* Artifact header bar */}
                  <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2">
                    <button
                      onClick={() => toggleArtifactCollapsed(artifact.id)}
                      className="flex items-center gap-2 text-left"
                    >
                      {collapsed ? (
                        <ChevronRight
                          size={isCompact ? 12 : 14}
                          className="shrink-0 text-[var(--text-muted)]"
                        />
                      ) : (
                        <ChevronDown
                          size={isCompact ? 12 : 14}
                          className="shrink-0 text-[var(--text-muted)]"
                        />
                      )}
                      <span
                        className={cn(
                          "font-medium text-[var(--text-primary)]",
                          isCompact ? "text-xs" : "text-sm",
                        )}
                      >
                        {artifact.title}
                      </span>
                    </button>

                    <span className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-3xs text-[var(--text-muted)]">
                      {artifact.type}
                    </span>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Pin/unpin */}
                    <button
                      onClick={() => handlePin(artifact)}
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded",
                        "transition-colors",
                        isPinned
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--text-muted)] opacity-0 hover:opacity-100",
                      )}
                      title={isPinned ? "Unpin" : "Pin to panel"}
                    >
                      {isPinned ? (
                        <Pin size={isCompact ? 12 : 14} />
                      ) : (
                        <PinOff size={isCompact ? 12 : 14} />
                      )}
                    </button>

                    {/* Move to right panel */}
                    <button
                      onClick={() => handleMoveToPanel(artifact)}
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-all hover:text-[var(--color-primary)]"
                      title="Open in right panel"
                    >
                      <PanelRight size={isCompact ? 12 : 14} />
                    </button>

                    {/* Expand/collapse all */}
                    <button
                      onClick={() => toggleArtifactCollapsed(artifact.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] opacity-0 transition-all hover:text-[var(--text-primary)]"
                      title={collapsed ? "Expand" : "Collapse"}
                    >
                      {collapsed ? (
                        <Maximize2 size={isCompact ? 12 : 14} />
                      ) : (
                        <Minimize2 size={isCompact ? 12 : 14} />
                      )}
                    </button>
                  </div>

                  {/* Artifact content — hidden when collapsed */}
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(isCompact && "text-xs")}
                      >
                        <div className={isCompact ? "p-2" : "p-3"}>
                          <ArtifactRenderer artifact={artifact} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {message.toolCalls?.map((tc) => (
            <motion.div
              key={tc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <ToolCallCard toolCall={tc} />
            </motion.div>
          ))}
        </AnimatePresence>

        {message.diffs?.map((diff, i) => (
          <DiffView key={`${diff.filePath}-${i}`} diff={diff} />
        ))}

        <span
          className={cn(
            "text-3xs text-[var(--text-muted)]",
            isUser ? "text-right" : "text-left",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}
