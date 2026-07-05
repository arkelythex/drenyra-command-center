"use client";

import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MotionDiv } from "../motion-primitives";
import { useDesignTokens } from "@/lib/design-tokens";
import { useReducedMotion } from "framer-motion";

interface CommandDeckProps {
  children: ReactNode;
  className?: string;
  isVisible?: boolean;
}

/**
 * Drenyra "One UI" Command Deck
 * Moves primary interactions to the bottom third for reachability.
 */
export const CommandDeck = ({ children, className, isVisible = true }: CommandDeckProps) => {
  const { zIndex, backdropBlur } = useDesignTokens();
  const prefersReducedMotion = useReducedMotion();
  return (
    <MotionDiv
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: isVisible ? 0 : 100, opacity: isVisible ? 1 : 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0.12, ease: "easeOut" }
          : { duration: 0.18, ease: "easeOut" }
      }
      className={cn(
        "fixed bottom-6 left-4 right-4 sm:hidden",
        `rounded-2xl border border-border/50 bg-card shadow-xl ${backdropBlur.modal} p-2`,
        "flex items-center justify-around gap-2",
        className
      )}
      style={{ zIndex: zIndex.modal }}
    >
      {children}
    </MotionDiv>
  );
};

export const DeckItem = ({ 
  icon: Icon, 
  label, 
  onClick, 
  isActive 
}: { 
  icon: ComponentType<{ size?: number }>; 
  label?: string; 
  onClick: () => void;
  isActive?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex grow flex-col items-center justify-center rounded-xl p-2 transition-[background-color,color,transform] duration-200",
      isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-card/80"
    )}
  >
    <Icon size={20} />
    {label && <span className="text-3xs font-black uppercase tracking-tighter mt-1">{label}</span>}
  </button>
);
