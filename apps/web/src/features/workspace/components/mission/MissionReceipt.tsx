import { Copy, CheckCircle } from "lucide-react";

interface MissionReceiptProps {
  receiptId: string;
  receiptHash: string;
  onCopy: () => void;
}

export function MissionReceipt({ receiptId, onCopy }: MissionReceiptProps) {
  return (
    <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle size={16} className="text-green-500" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Recibo de aprobación
        </h3>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2">
        <code className="flex-1 text-xs font-mono text-[var(--text-primary)] truncate">
          {receiptId}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
        >
          <Copy size={12} />
          Copiar
        </button>
      </div>
    </div>
  );
}
