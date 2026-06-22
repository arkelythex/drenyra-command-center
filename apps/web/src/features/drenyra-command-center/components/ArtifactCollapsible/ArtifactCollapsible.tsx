"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ArtifactRenderer } from "../../../cognitive-hub/components/artifacts/ArtifactRenderer";
import type { ArtifactCollapsibleProps } from "./ArtifactCollapsible.types";
import { CollapsibleHeader } from "./components/CollapsibleHeader";
import { generateExportContent } from "./ArtifactCollapsible.data";

function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const ArtifactCollapsible = ({
  artifact,
  density,
  isPinned,
  onPin,
  onFocus,
  onCreateCase,
}: ArtifactCollapsibleProps) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      onFocus(artifact);
    }
  }, [expanded, artifact, onFocus]);

  const handlePin = useCallback(() => {
    onPin(artifact.id);
  }, [artifact.id, onPin]);

  const handleCreateCase = useCallback(() => {
    onCreateCase?.(artifact);
  }, [artifact, onCreateCase]);

  const handleExport = useCallback(() => {
    const { filename, content, mimeType } = generateExportContent(artifact);
    downloadBlob(filename, content, mimeType);
  }, [artifact]);

  return (
    <div
      className={cn(
        "group rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden transition-[border-color]",
        expanded && "border-[var(--border-default)]",
      )}
      role="region"
      aria-label={`Artifact: ${artifact.title || artifact.type}`}
    >
      <CollapsibleHeader
        artifact={artifact}
        density={density}
        isPinned={isPinned}
        expanded={expanded}
        onToggle={handleToggle}
        onPin={handlePin}
        onExport={handleExport}
        onCreateCase={onCreateCase ? handleCreateCase : undefined}
      />

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            id={`artifact-content-${artifact.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--border-subtle)]">
              <ArtifactRenderer artifact={artifact} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

ArtifactCollapsible.displayName = "ArtifactCollapsible";
