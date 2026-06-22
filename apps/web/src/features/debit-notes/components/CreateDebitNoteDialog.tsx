import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatPEN } from "@/lib/utils";
import { useCreateDebitNote } from "../hooks/useDebitNotes";
import type { CreateDebitNotePayload } from "../types";

const debitNoteSchema = z.object({
  referenceInvoiceId: z.string().min(1, "La factura de referencia es requerida"),
  reason: z.string().min(1, "El motivo es requerido"),
  series: z
    .string()
    .regex(/^[FB]D\d{2}$/, "La serie debe ser FD01 o BD01"),
  issueDate: z.string().min(1, "La fecha de emisión es requerida"),
  currency: z.enum(["PEN", "USD", "EUR"]),
  baseAmount: z.string().min(1, "El monto base es requerido"),
  igvAmount: z.string().min(1, "El monto IGV es requerido"),
});

type DebitNoteFormValues = z.infer<typeof debitNoteSchema>;

interface CreateDebitNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDebitNoteDialog({ open, onOpenChange, onSuccess }: CreateDebitNoteDialogProps) {
  const createDebitNote = useCreateDebitNote();
  const [calculatedTotal, setCalculatedTotal] = useState<string | null>(null);

  const form = useForm<DebitNoteFormValues>({
    resolver: zodResolver(debitNoteSchema),
    defaultValues: {
      referenceInvoiceId: "",
      reason: "",
      series: "",
      issueDate: new Date().toISOString().split("T")[0],
      currency: "PEN",
      baseAmount: "",
      igvAmount: "",
    },
  });

  const baseAmount = form.watch("baseAmount");
  const igvAmount = form.watch("igvAmount");
  const currency = form.watch("currency");

  const updateCalculatedTotal = (base: string, igv: string) => {
    const baseNum = Number.parseFloat(base) || 0;
    const igvNum = Number.parseFloat(igv) || 0;
    const total = baseNum + igvNum;
    setCalculatedTotal(
      currency === "PEN"
        ? formatPEN(total)
        : `S/ ${total.toFixed(2)}`,
    );
  };

  const onSubmit = async (values: DebitNoteFormValues) => {
    try {
      await createDebitNote.mutateAsync(values as CreateDebitNotePayload);
      form.reset();
      setCalculatedTotal(null);
      onSuccess();
    } catch {
      toast.error("Error al crear nota de débito");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Nota de Débito</DialogTitle>
          <DialogDescription>
            Crea una nota de débito SUNAT tipo 08 para incrementar el monto de una factura
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="referenceInvoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factura de Referencia</FormLabel>
                  <FormControl>
                    <Input placeholder="ID de la factura" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ej: Incremento de valor por diferencia de cambio"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="series"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serie</FormLabel>
                    <FormControl>
                      <Input placeholder="FD01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Emisión</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PEN">PEN (S/)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Imponible (Cargo Adicional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          updateCalculatedTotal(e.target.value, igvAmount);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="igvAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IGV (18%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          updateCalculatedTotal(baseAmount, e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {calculatedTotal && (
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Nota de Débito:</span>
                  <span className="text-lg font-semibold text-foreground">{calculatedTotal}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createDebitNote.isPending}>
                {createDebitNote.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear Nota de Débito
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
