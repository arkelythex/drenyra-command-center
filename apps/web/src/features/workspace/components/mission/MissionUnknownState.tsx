import { useState } from "react";
import { AlertOctagon, Play, CheckCircle, XCircle } from "lucide-react";

interface MissionUnknownStateProps {
  onReconcile: (resolution: string, reason: string) => void;
  isSubmitting: boolean;
}

export function MissionUnknownState({ onReconcile, isSubmitting }: MissionUnknownStateProps) {
  const [reason, setReason] = useState("");

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <AlertOctagon size={20} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Estado desconocido
        </h3>
      </div>
      <p className="text-xs text-[var(--text-secondary)]">
        No se pudo confirmar el estado de la misión. Elige cómo resolver:
      </p>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo de la resolución (requerido)"
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none"
        rows={2}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onReconcile("RUNNING", reason)}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          <Play size={14} />
          Reanudar (RUNNING)
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onReconcile("COMPLETED", reason)}
          className="flex items-center gap-1.5 rounded-lg border border-green-500/30 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-500/10 disabled:opacity-50"
        >
          <CheckCircle size={14} />
          Marcar completado (COMPLETED)
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => onReconcile("FAILED", reason)}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
        >
          <XCircle size={14} />
          Marcar fallido (FAILED)
        </button>
      </div>
    </div>
  );
}
