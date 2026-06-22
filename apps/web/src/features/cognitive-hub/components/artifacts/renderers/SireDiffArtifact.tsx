import React from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import type { HubArtifact } from '@arkelythex/shared/artifacts';
import { cn } from '@/lib/utils';

interface SireDiffArtifactProps {
  artifact: HubArtifact;
}

export const SireDiffArtifact: React.FC<SireDiffArtifactProps> = ({ artifact }) => {
  // Datos mockeados para el Diff SIRE
  const mockRows = [
    { id: '1', comprobante: 'F001-00123', fecha: '12/04', ruc: '20123456789', razonSocial: 'PROVEEDOR 1 S.A.C.', biActual: '1000.00', biPropuesto: '1000.00', igvActual: '180.00', igvPropuesto: '180.00', diff: false, status: 'ok' },
    { id: '2', comprobante: 'E001-00456', fecha: '15/04', ruc: '20987654321', razonSocial: 'SERVICIOS TECH E.I.R.L.', biActual: '500.00', biPropuesto: '500.00', igvActual: '0.00', igvPropuesto: '90.00', diff: true, status: 'warning', note: 'IGV omitido en SIRE' },
    { id: '3', comprobante: 'F002-00089', fecha: '16/04', ruc: '20555555555', razonSocial: 'ALQUILERES LIMA', biActual: '0.00', biPropuesto: '1200.00', igvActual: '0.00', igvPropuesto: '216.00', diff: true, status: 'danger', note: 'Comprobante no hallado en SIRE' },
  ];

  return (
    <div className="flex h-full flex-col bg-[var(--surface-1)]">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Reconciliación SIRE vs Sistema Contable</h3>
        <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">Periodo: Abril 2026 · Registro de Compras</p>
        
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-center">
            <span className="block text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">SIRE SUNAT</span>
            <span className="mt-1 block font-mono text-[13px] font-medium text-[var(--text-primary)]">S/ 1,500.00</span>
          </div>
          <div className="flex items-center justify-center text-[var(--text-tertiary)]">
            <ArrowRight size={16} />
          </div>
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-center">
            <span className="block text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Propuesta Arkelythex</span>
            <span className="mt-1 block font-mono text-[13px] font-bold text-[var(--color-success)]">S/ 2,700.00</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] overflow-hidden">
          <table className="w-full text-left text-label">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--surface-1)] text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
              <tr>
                <th className="px-3 py-2">Comprobante</th>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Proveedor</th>
                <th className="px-3 py-2 text-right">Base Imp.</th>
                <th className="px-3 py-2 text-center">IGV SIRE</th>
                <th className="px-3 py-2 text-center">IGV Propuesto</th>
                <th className="px-3 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {mockRows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className={cn(
                    "transition-colors hover:bg-[var(--surface-hover)]",
                    row.diff && "bg-warning/5"
                  )}>
                    <td className="px-3 py-2 font-mono font-medium text-[var(--text-primary)]">{row.comprobante}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.fecha}</td>
                    <td className="px-3 py-2">
                      <span className="block truncate max-w-[120px] text-[var(--text-primary)]" title={row.razonSocial}>{row.razonSocial}</span>
                      <span className="block font-mono text-3xs text-[var(--text-tertiary)]">{row.ruc}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-right text-[var(--text-secondary)]">{row.biPropuesto}</td>
                    <td className="px-3 py-2 font-mono text-center">
                      <span className={cn(row.diff && "line-through opacity-50")}>{row.igvActual}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-center font-bold">
                      <span className={cn(row.diff ? "text-amber-500" : "text-[var(--text-secondary)]")}>{row.igvPropuesto}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.diff && (
                        <div className="flex justify-center text-amber-500">
                          <AlertTriangle size={14} />
                        </div>
                      )}
                    </td>
                  </tr>
                  {row.diff && row.note && (
                    <tr className="bg-amber-500/10">
                      <td colSpan={7} className="px-3 py-1.5 text-2xs font-medium text-amber-600 dark:text-amber-400">
                        <span className="font-bold uppercase tracking-wider">Discrepancia:</span> {row.note}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
