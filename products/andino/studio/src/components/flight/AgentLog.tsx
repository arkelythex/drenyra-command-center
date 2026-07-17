"use client";

import { useEffect, useRef } from "react";
import type { AgentEvent } from "@/types/drone";

function severityColor(severity: AgentEvent["severity"]): string {
  switch (severity) {
    case "info": return "text-accent-400";
    case "warning": return "text-warning";
    case "error": return "text-error";
    default: return "text-text-muted";
  }
}

export default function AgentLog({ events }: { events: AgentEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="h-full flex flex-col bg-bg-void/50">
      <div className="px-3 py-2 border-b border-border-subtle">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Agent Log</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5">
        {events.map((ev) => (
          <div key={ev.id} className="flex gap-3 items-start">
            <span className="text-text-muted flex-shrink-0">{ev.timestamp}</span>
            <span className={`flex-shrink-0 ${severityColor(ev.severity)}`}>
              {ev.severity === "info" ? "[i]" : ev.severity === "warning" ? "[!]" : "[x]"}
            </span>
            <span className="text-text-secondary leading-relaxed">
              <span className="text-text-primary">{ev.agent}:</span> {ev.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
