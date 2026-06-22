import { SireTableRow } from './sire-table-row';
import type { SireTableRowData } from './sire-management.types';

interface SirePreviewTableProps {
  rows: SireTableRowData[];
  isLoading: boolean;
  hasError: boolean;
}

function SirePreviewTableMessage(props: { message: string; tone: 'muted' | 'danger' }) {
  const toneClass =
    props.tone === 'danger'
      ? 'text-danger'
      : 'text-muted-foreground';

  return (
    <tr>
      <td colSpan={5} className={`px-10 py-10 text-center text-sm font-semibold ${toneClass}`}>
        {props.message}
      </td>
    </tr>
  );
}

export const SirePreviewTable = ({ rows, isLoading, hasError }: SirePreviewTableProps) => {
  return (
    <div className="overflow-x-auto p-0">
      <table className="min-w-[900px] w-full border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-border/40 bg-card px-8 py-5 text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              Comprobante
            </th>
            <th className="border-b border-border/40 bg-muted/[0.08] px-4 py-5 text-center text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              Estado SUNAT
            </th>
            <th className="border-b border-border/40 bg-muted/[0.08] px-4 py-5 text-center text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              Estado Interno
            </th>
            <th className="border-b border-border/40 bg-muted/[0.08] px-4 py-5 text-right text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              Diferencia
            </th>
            <th className="sticky right-0 z-10 border-b border-border/40 bg-card px-8 py-5 text-right text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              Resolución
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {isLoading ? (
            <SirePreviewTableMessage message="Cargando preview SIRE..." tone="muted" />
          ) : hasError ? (
            <SirePreviewTableMessage
              message="No se pudo cargar el preview SIRE para este periodo demo."
              tone="danger"
            />
          ) : rows.length === 0 ? (
            <SirePreviewTableMessage
              message="Sin registros SIRE disponibles para este periodo demo."
              tone="muted"
            />
          ) : (
            rows.map((row) => <SireTableRow key={row.id} row={row} />)
          )}
        </tbody>
      </table>
    </div>
  );
};
