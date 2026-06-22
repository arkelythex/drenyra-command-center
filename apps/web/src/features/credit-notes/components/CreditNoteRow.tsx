import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { MoreHorizontal, Send, Trash2, Eye, CheckCircle, XCircle, ArrowUp } from "lucide-react";
import type { CreditNoteRecord } from "../types";

const creditNoteTypeConfig: Record<CreditNoteRecord['creditNoteType'], { label: string; variant: 'danger' | 'info' | 'warning' | 'neutral' }> = {
  ANULACION: { label: 'Anulación', variant: 'danger' },
  DESCUENTO: { label: 'Descuento', variant: 'info' },
  DEVOLUCION: { label: 'Devolución', variant: 'warning' },
  OTROS: { label: 'Otros', variant: 'neutral' },
};

const statusConfig: Record<CreditNoteRecord['status'], 'neutral' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  SENT: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

const statusLabel: Record<CreditNoteRecord['status'], string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
};

interface CreditNoteRowProps {
  creditNote: CreditNoteRecord;
  n: (v: number) => string;
  onView?: (id: string) => void;
  onSendOse?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export function CreditNoteRow({ creditNote, n, onView, onSendOse, onUpdateStatus, onDelete }: CreditNoteRowProps) {
  const typeConfig = creditNoteTypeConfig[creditNote.creditNoteType];
  const status = statusConfig[creditNote.status];

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/40">
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-foreground">
          {creditNote.fullNumber}
        </span>
      </td>
      <td className="px-4 py-3">
        <Badge variant="soft" status={typeConfig.variant} size="sm">
          {typeConfig.label}
        </Badge>
      </td>
      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground">
        {creditNote.reason}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} label={statusLabel[creditNote.status]} size="sm" />
      </td>
      <td className="px-4 py-3 font-mono text-sm tabular-nums text-foreground">
        {n(Number.parseFloat(creditNote.totalAmount) || 0)}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(creditNote.issueDate)}
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Más opciones" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onClick={() => onView?.(creditNote.id)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalle
            </DropdownMenuItem>

            {(creditNote.status === 'DRAFT' || creditNote.status === 'SENT') && (
              <DropdownMenuItem onClick={() => onSendOse?.(creditNote.id)}>
                <Send className="mr-2 h-4 w-4" /> Enviar a SUNAT
              </DropdownMenuItem>
            )}

            {creditNote.status === 'DRAFT' && (
              <DropdownMenuItem onClick={() => onUpdateStatus?.(creditNote.id, 'SENT')}>
                <ArrowUp className="mr-2 h-4 w-4" /> Marcar como Enviado
              </DropdownMenuItem>
            )}

            {creditNote.status === 'SENT' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateStatus?.(creditNote.id, 'ACCEPTED')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-success" /> Aceptar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus?.(creditNote.id, 'REJECTED')}>
                  <XCircle className="mr-2 h-4 w-4 text-danger" /> Rechazar
                </DropdownMenuItem>
              </>
            )}

            {creditNote.status === 'DRAFT' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(creditNote.id)}
                  className="text-danger focus:text-danger"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
