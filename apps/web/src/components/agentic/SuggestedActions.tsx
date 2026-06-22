"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SuggestedAction {
  icon: string;
  label: string;
  command?: string;
  action?: string;
}

interface SuggestedActionsProps {
  onAction: (action: SuggestedAction) => void;
}

const SUGGESTED_ACTIONS: SuggestedAction[] = [
  { icon: "📊", label: "Detalle", command: "/detalle" },
  { icon: "📋", label: "Resumen", command: "/resumen" },
  { icon: "🤖", label: "Correr agente", command: "/agente" },
  { icon: "📎", label: "Subir documento", action: "upload" },
];

export function SuggestedActions({ onAction }: SuggestedActionsProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.05, delayChildren: 0.15 },
        },
      }}
      className="mt-3 flex items-center gap-1.5"
    >
      {SUGGESTED_ACTIONS.map((action) => (
        <motion.button
          key={action.label}
          type="button"
          onClick={() => onAction(action)}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
            "border border-[var(--border-subtle)]",
            "text-[var(--text-muted)]",
            "hover:border-[var(--border-default)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]",
          )}
        >
          <span className="text-xs">{action.icon}</span>
          <span>{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
