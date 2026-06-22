import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface SireDiffFooterProps {
  critical: number;
  acceptSunat: number;
  keepLocal: number;
  pending: number;
  onApplyKeepLocalBatch: () => void;
  onApplyAcceptSunatBatch: () => void;
}

export function SireDiffFooter({
  critical,
  acceptSunat,
  keepLocal,
  pending,
  onApplyKeepLocalBatch,
  onApplyAcceptSunatBatch,
}: SireDiffFooterProps) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-label">
        <ShieldAlert size={14} className="text-amber-500" />
        <span className="font-semibold text-amber-600">
          Discrepancias criticas detectadas: {critical}. Requiere validacion previa al commit.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-2xs uppercase tracking-wider text-muted-foreground">
          Aceptar SUNAT: {acceptSunat} | Mantener Local: {keepLocal} | Pendientes: {pending}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onApplyKeepLocalBatch}
            className="h-9 rounded-xl border border-border bg-card px-3 text-2xs font-black uppercase tracking-wider text-foreground hover:bg-muted"
          >
            Mantener Local (Lote)
          </button>
          <button
            type="button"
            onClick={onApplyAcceptSunatBatch}
            className="inline-flex h-9 items-center rounded-xl border border-primary/30 bg-primary px-3 text-2xs font-black uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
          >
            <AlertTriangle size={12} className="mr-1" />
            Aceptar SUNAT (Lote)
          </button>
        </div>
      </div>
    </>
  );
}
