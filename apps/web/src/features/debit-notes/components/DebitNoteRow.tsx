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
import type { DebitNoteRecord } from "../types";

const statusConfig: Record<DebitNoteRecord['status'], 'neutral' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  SENT: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

const statusLabel: Record<DebitNoteRecord['status'], string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
};

interface DebitNoteRowProps {
  debitNote: DebitNoteRecord;
  n: (v: number) => string;
  onView?: (id: string) => void;
  onSendOse?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

export function DebitNoteRow({ debitNote, n, onView, onSendOse, onUpdateStatus, onDelete }: DebitNoteRowProps) {
  const status = statusConfig[debitNote.status];

  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/40">
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-foreground">
          {debitNote.fullNumber}
        </span>
      </td>
      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-muted-foreground">
        {debitNote.reason}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={status} label={statusLabel[debitNote.status]} size="sm" />
      </td>
      <td className="px-4 py-3 font-mono text-sm tabular-nums text-foreground">
        {n(Number.parseFloat(debitNote.additionalAmount) || 0)}
      </td>
      <td className="px-4 py-3 font-mono text-sm tabular-nums text-foreground">
        {n(Number.parseFloat(debitNote.totalAmount) || 0)}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {formatDate(debitNote.issueDate)}
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Más opciones" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onClick={() => onView?.(debitNote.id)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalle
            </DropdownMenuItem>

            {(debitNote.status === 'DRAFT' || debitNote.status === 'SENT') && (
              <DropdownMenuItem onClick={() => onSendOse?.(debitNote.id)}>
                <Send className="mr-2 h-4 w-4" /> Enviar a SUNAT
              </DropdownMenuItem>
            )}

            {debitNote.status === 'DRAFT' && (
              <DropdownMenuItem onClick={() => onUpdateStatus?.(debitNote.id, 'SENT')}>
                <ArrowUp className="mr-2 h-4 w-4" /> Marcar como Enviado
              </DropdownMenuItem>
            )}

            {debitNote.status === 'SENT' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onUpdateStatus?.(debitNote.id, 'ACCEPTED')}>
                  <CheckCircle className="mr-2 h-4 w-4 text-success" /> Aceptar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus?.(debitNote.id, 'REJECTED')}>
                  <XCircle className="mr-2 h-4 w-4 text-danger" /> Rechazar
                </DropdownMenuItem>
              </>
            )}

            {debitNote.status === 'DRAFT' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(debitNote.id)}
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
