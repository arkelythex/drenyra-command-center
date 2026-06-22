import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { formatPEN } from "@/lib/utils";
import { useCreditNotes } from "../hooks/useCreditNotes";

const createSchema = z.object({
  referenceInvoiceId: z.string().min(1, 'Requerido'),
  creditNoteType: z.enum(['ANULACION', 'DESCUENTO', 'DEVOLUCION', 'OTROS']),
  reason: z.string().min(3, 'Mínimo 3 caracteres'),
  series: z.string().regex(/^[FB]C\d{2}$/, 'Formato: FC01 o BC01'),
  issueDate: z.string().min(1, 'Requerido'),
  currency: z.enum(['PEN', 'USD', 'EUR']),
  baseAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
  igvAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido'),
});

type CreateCreditNoteFormData = z.infer<typeof createSchema>;

interface CreateCreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCreditNoteDialog({ open, onOpenChange }: CreateCreditNoteDialogProps) {
  const { companyContext } = useActiveCompanyContext();
  const { createCreditNote } = useCreditNotes();

  const form = useForm<CreateCreditNoteFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      currency: 'PEN',
      creditNoteType: 'DESCUENTO',
      series: 'FC01',
    },
  });

  const watchedBaseAmount = form.watch('baseAmount');
  const watchedIgvAmount = form.watch('igvAmount');

  const total = useMemo(() => {
    const base = Number.parseFloat(watchedBaseAmount || '0');
    const igv = Number.parseFloat(watchedIgvAmount || '0');
    return formatPEN(base + igv);
  }, [watchedBaseAmount, watchedIgvAmount]);

  const onSubmit = async (data: CreateCreditNoteFormData) => {
    try {
      await createCreditNote({
        companyId: companyContext.companyId,
        ...data,
      });
      onOpenChange(false);
      form.reset();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-surface-soft border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground tracking-tight uppercase">
            Nueva Nota de Crédito
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <FormField
              control={form.control}
              name="referenceInvoiceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factura de Referencia *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ID de la factura" className="h-11 bg-background border-border font-mono text-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creditNoteType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-background border-border font-mono text-xs">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ANULACION">Anulación</SelectItem>
                        <SelectItem value="DESCUENTO">Descuento</SelectItem>
                        <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                        <SelectItem value="OTROS">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="series"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serie *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-background border-border font-mono text-xs">
                          <SelectValue placeholder="Seleccionar serie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FC01">FC01</SelectItem>
                        <SelectItem value="FC02">FC02</SelectItem>
                        <SelectItem value="BC01">BC01</SelectItem>
                        <SelectItem value="BC02">BC02</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Descuento por volumen, devolución, etc." className="h-11 bg-background border-border font-mono text-xs" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Emisión *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" className="h-11 bg-background border-border font-mono text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 bg-background border-border font-mono text-xs">
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PEN">PEN (Soles)</SelectItem>
                        <SelectItem value="USD">USD (Dólares)</SelectItem>
                        <SelectItem value="EUR">EUR (Euros)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="baseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Imponible *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1000.00" className="h-11 bg-background border-border font-mono text-xs" />
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
                    <FormLabel>IGV *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="180.00" className="h-11 bg-background border-border font-mono text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Total
              </span>
              <span className="font-mono text-lg font-bold text-foreground tabular-nums">
                {total}
              </span>
            </div>

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="h-11 w-full font-black text-xs bg-primary hover:bg-primary/90"
            >
              {form.formState.isSubmitting ? 'CREANDO...' : 'CREAR NOTA DE CRÉDITO'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
