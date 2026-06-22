import { useState } from "react";
import { FileText, CheckCircle2, AlertTriangle, FileCheck, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, n } from "@/lib/utils";
import { useCpeErrorCatalog } from "../../hooks/useCpeErrorCatalog";
import { useCpeValidation } from "../../hooks/useCpeValidation";
import { CpeIncidentGuidanceCard } from "./cpe-validator/CpeIncidentGuidanceCard";
import { MOCK_CPES } from "./cpe-validator/cpe-validator.mock";

export const CpeValidatorTab = () => {
  const [selectedId, setSelectedId] = useState(
    MOCK_CPES.find((row) => row.sunatCode)?.id ?? MOCK_CPES[0]?.id ?? "",
  );
  const catalogQuery = useCpeErrorCatalog();
  const validationMutation = useCpeValidation();
  const selectedRow = MOCK_CPES.find((row) => row.id === selectedId) ?? null;
  const effectiveCode = validationMutation.data?.code ?? selectedRow?.sunatCode;
  const guidance = catalogQuery.data?.find((entry) => entry.code === effectiveCode);

  return (
    <div className="space-y-8 animate-entrance">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">Validación de Comprobantes</h2>
                <p className="text-label text-muted-foreground uppercase tracking-[0.2em] mt-1">Integridad XML/CDR • Protocolo NIIF</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg border border-success-subtle bg-success-muted p-2">
                        <p className="text-2xs font-black text-success uppercase tracking-widest">ACEPTADOS</p>
                        <p className="text-sm font-black text-success">12</p>
                    </div>
                    <div className="rounded-lg border border-warning-subtle bg-warning-muted p-2">
                        <p className="text-2xs font-black uppercase tracking-widest text-warning">PENDIENTES</p>
                        <p className="text-sm font-black text-warning">4</p>
                    </div>
                    <div className="rounded-lg border border-danger-subtle bg-danger-muted p-2">
                        <p className="text-2xs font-black uppercase tracking-widest text-danger">RECHAZADOS</p>
                        <p className="text-sm font-black text-danger">2</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="btn-soft"><Filter size={14} /> Filtros</Button>
                    <Button
                      size="default"
                      disabled={!selectedRow || validationMutation.isPending}
                      onClick={() => selectedRow && validationMutation.mutate(selectedRow)}
                      className="shadow-sm transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <FileCheck size={16} />
                      {validationMutation.isPending ? "Validando..." : "Validar Seleccion"}
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
            <Card className="border-border/40 shadow-sm">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="px-10 py-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50">Documento / Emisor</th>
                                <th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 text-center">Estado SUNAT</th>
                                <th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 text-center">CDR</th>
                                <th className="px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 text-center">Detracción</th>
                                <th className="px-10 py-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {MOCK_CPES.map((cpe) => (
                                <tr
                                    key={cpe.id}
                                    onClick={() => {
                                        if (selectedId !== cpe.id) {
                                            validationMutation.reset();
                                        }
                                        setSelectedId(cpe.id);
                                    }}
                                    className={cn(
                                        "group cursor-pointer transition-colors duration-200 hover:bg-muted/20",
                                        selectedId === cpe.id && "bg-muted/20",
                                    )}
                                >
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="rounded-xl border border-border bg-muted p-2.5 text-muted-foreground transition-[background-color,color,border-color] duration-200 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background"><FileText size={18} strokeWidth={1.5} /></div>
                                            <div>
                                                <p className="font-black text-xs text-foreground uppercase tracking-tight">{cpe.document}</p>
                                                <p className="text-xs font-bold text-muted-foreground uppercase mt-1">{cpe.provider}</p>
                                                {cpe.sunatCode ? (
                                                    <p className="mt-2 text-2xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                        Codigo {cpe.sunatCode}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        <span className={cn(
                                            "rounded-lg border px-3 py-1 text-xs font-black uppercase tracking-widest transition-colors duration-200 shadow-sm",
                                            cpe.status === "ACEPTADO" ? "bg-success-muted text-success border-success-subtle" :
                                            cpe.status === "RECHAZADO" ? "bg-destructive/10 text-destructive border-destructive/20" :
                                            "bg-warning/10 text-warning border-warning/20"
                                        )}>{cpe.status}</span>
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        {cpe.hasCDR ? <CheckCircle2 size={16} className="mx-auto text-foreground" /> : <AlertTriangle size={16} className="mx-auto text-muted-foreground/60" />}
                                    </td>
                                    <td className="px-4 py-6 text-center">
                                        {cpe.detraction ? (
                                            <span className="text-xs font-black text-foreground bg-muted px-2 py-1 rounded border border-border uppercase tracking-tighter">Sujeto a 10%</span>
                                        ) : <span className="text-muted-foreground/60">—</span>}
                                    </td>
                                    <td className="px-10 py-6 text-right font-black font-mono text-sm text-foreground tabular-nums tracking-tighter">
                                        {n(cpe.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <CpeIncidentGuidanceCard
                selectedRow={selectedRow}
                guidance={guidance}
                validation={validationMutation.data ?? null}
                isLoading={catalogQuery.isLoading}
                isError={catalogQuery.isError}
                onRetry={() => void catalogQuery.refetch()}
                onValidate={() => selectedRow && validationMutation.mutate(selectedRow)}
                isValidating={validationMutation.isPending}
            />
        </div>
    </div>
  );
};
