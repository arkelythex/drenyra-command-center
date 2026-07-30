import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import type { MissionStep } from "@drenyra/mission-domain";

interface MissionProgressProps {
  progress: number;
  steps: MissionStep[];
  currentStep: string;
}

const ICON_MAP: Record<string, typeof CheckCircle> = {
  COMPLETED: CheckCircle,
  IN_PROGRESS: Loader2,
  FAILED: AlertTriangle,
};

export function MissionProgress({ progress, steps, currentStep }: MissionProgressProps) {
  const displayPercent = Math.round(progress / 100);

  return (
    <div className="space-y-4">
      <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step) => {
            const IconComponent = ICON_MAP[step.status];
            const isActive = step.id === currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  isActive
                    ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                    : "border-[var(--border-subtle)]"
                }`}
              >
                {IconComponent ? (
                  <IconComponent
                    size={16}
                    className={
                      step.status === "COMPLETED"
                        ? "text-green-500 shrink-0"
                        : step.status === "IN_PROGRESS"
                          ? "animate-spin text-[var(--accent)] shrink-0"
                          : "text-red-500 shrink-0"
                    }
                  />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--border-subtle)] shrink-0" />
                )}
                <span className="text-xs text-[var(--text-primary)]">
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
