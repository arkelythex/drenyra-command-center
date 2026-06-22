import { CheckCircle2, FileSearch, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ReconciliationCandidate,
  ReconciliationLedgerEntry,
  ReconciliationTransaction,
} from "../../reconciliation.types";

interface ReconciliationMatchWorkspaceProps {
  activeCandidate?: ReconciliationCandidate;
  activeTransaction: ReconciliationTransaction;
  formatMoney: (value: number) => string;
  ledgerEntries: readonly ReconciliationLedgerEntry[];
  onSelectCandidate: (candidateId: string) => void;
}

export function ReconciliationMatchWorkspace({
  activeCandidate,
  activeTransaction,
  formatMoney,
  ledgerEntries,
  onSelectCandidate,
}: ReconciliationMatchWorkspaceProps) {
  return (
    <section className="flex min-h-0 flex-col bg-background">
      <div className="border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-label font-black uppercase tracking-[0.18em] text-muted-foreground">
              Match workspace
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
              Comparar movimiento y asiento
            </h2>
          </div>

          <Button variant="outline" size="sm" className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo asiento
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 custom-scrollbar">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Card className="border-border/60 bg-[var(--surface-1)]">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Movimiento bancario</CardTitle>
              <CardDescription>Detalle operativo del extracto activo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-2xl border border-border/60 bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Descripción</p>
                <p className="mt-2 text-base font-semibold text-foreground">
                  {activeTransaction.description}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Metric label="Fecha" value={activeTransaction.date} />
                <Metric label="Monto" value={formatMoney(activeTransaction.amount)} mono />
                <Metric label="Estado" value={activeTransaction.status.replace("_", " ")} />
              </div>

              <div className="rounded-2xl border border-border/60 bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Notas de revisión</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {activeTransaction.notes}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-[var(--surface-1)]">
            <CardHeader className="border-b border-border/50">
              <CardTitle>Candidatos sugeridos</CardTitle>
              <CardDescription>
                Coincidencias asistidas por IA y acceso a búsqueda manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {activeTransaction.candidates.length > 0 ? (
                activeTransaction.candidates.map((candidate) => {
                  const isActive = activeCandidate?.id === candidate.id;

                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => onSelectCandidate(candidate.id)}
                        className={`w-full rounded-2xl border p-4 text-left transition-colors duration-150 ${
                        isActive
                          ? "border-info-muted bg-info-subtle"
                          : "border-border/60 bg-[var(--surface-2)] hover:border-[var(--border-default)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{candidate.vendor}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                            Ledger {candidate.ledgerEntryId}
                          </p>
                        </div>
                        {isActive ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        ) : null}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="font-mono text-sm tabular-nums text-foreground">
                          {formatMoney(candidate.amount)}
                        </p>
                        <span className="rounded-full border border-border/60 px-2.5 py-1 text-label font-medium text-muted-foreground">
                          Score {candidate.score}%
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                        {candidate.rationale}
                      </p>
                    </button>
                  );
                })
              ) : (
                <EmptyPanel />
              )}

              <div className="rounded-2xl border border-dashed border-border/60 bg-[var(--surface-2)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background text-info">
                    <Search className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Búsqueda manual</p>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">
                      Usa búsqueda o crea un asiento si no hay match confiable.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-[var(--surface-2)] p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Ledger relacionado</p>
                <div className="mt-3 space-y-3">
                  {ledgerEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{entry.vendor}</p>
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          {entry.reference} · {entry.date}
                        </p>
                      </div>
                      <p className="font-mono text-sm tabular-nums text-[var(--text-secondary)]">
                        {formatMoney(entry.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-[var(--surface-2)] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-2 text-sm font-semibold text-foreground ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-[var(--surface-2)] p-6 text-center">
      <FileSearch className="mx-auto h-6 w-6 text-muted-foreground" />
      <p className="mt-3 text-sm font-semibold text-foreground">Sin match sugerido</p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        Este movimiento requiere investigación manual o creación de un nuevo asiento.
      </p>
    </div>
  );
}
