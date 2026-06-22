"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Message } from "./ThreadView.types";

// ─── Streaming Text ──────────────────────────────────────────────────────────

export function StreamingText({
  content,
  status,
}: {
  content: string;
  status: Message["status"];
}) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [cursorPhase, setCursorPhase] = useState<"blink" | "pulse" | "gone">(
    status === "streaming" ? "blink" : "gone",
  );
  const contentRef = useRef(content);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    contentRef.current = content;
  });

  useEffect(() => {
    if (status !== "streaming") {
      setDisplayedLength(content.length);
      return;
    }

    setDisplayedLength(0);

    const RATE = 5;
    const TICK = 16;

    const id = setInterval(() => {
      setDisplayedLength((prev) => {
        const total = contentRef.current.length;
        const next = prev + RATE;
        return next >= total ? total : next;
      });
    }, TICK);

    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === "complete") {
      setDisplayedLength(content.length);
      setCursorPhase("pulse");
      pulseTimerRef.current = setTimeout(() => setCursorPhase("gone"), 1000);
    }
    if (status === "streaming") {
      setCursorPhase("blink");
    }
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [status, content.length]);

  return (
    <>
      <span>{content.slice(0, displayedLength)}</span>
      {cursorPhase !== "gone" && (
        <motion.span
          className="ml-0.5 inline-block h-4 w-[2px] bg-[var(--color-primary)]"
          animate={
            cursorPhase === "pulse"
              ? { opacity: [1, 1, 0], scaleY: [1, 1.5, 0] }
              : { opacity: [1, 0, 1] }
          }
          transition={
            cursorPhase === "pulse"
              ? { duration: 1, ease: "easeInOut", times: [0, 0.3, 1] }
              : { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
          }
        />
      )}
    </>
  );
}

// ─── Streaming Indicator ─────────────────────────────────────────────────────

export function StreamingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--premium-info)]/10">
        <Sparkles size={14} className="text-[var(--premium-info)]" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-[var(--surface-2)] px-4 py-3">
        {[0, 0.2, 0.4].map((delay) => (
          <motion.span
            key={delay}
            className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
