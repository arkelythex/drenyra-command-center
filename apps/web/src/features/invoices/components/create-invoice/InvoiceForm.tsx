import { lazy, Suspense } from 'react';
import { Save, X, FileText, Globe } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Hooks
import { useInvoiceForm } from './hooks/useInvoiceForm';
import { useInvoiceCalculations } from './hooks/useInvoiceCalculations';
import type { CreateInvoicePayload, InvoiceCurrency } from './types';

const CustomerSelector = lazy(async () => {
  const mod = await import('./CustomerSelector');
  return { default: mod.CustomerSelector };
});

const InvoiceDateFields = lazy(async () => {
  const mod = await import('./InvoiceDateFields');
  return { default: mod.InvoiceDateFields };
});

const InvoiceLineItems = lazy(async () => {
  const mod = await import('./InvoiceLineItems');
  return { default: mod.InvoiceLineItems };
});

const InvoiceTotals = lazy(async () => {
  const mod = await import('./InvoiceTotals');
  return { default: mod.InvoiceTotals };
});

interface Props {
  onSubmit: (data: CreateInvoicePayload) => Promise<void>;
  onCancel: () => void;
  companyId: string;
}

export const InvoiceForm = ({ onSubmit, onCancel, companyId }: Props) => {
  const { formState, actions } = useInvoiceForm({ 
    onSubmit, 
    onSuccess: onCancel,
    companyId 
  });
  
  const totals = useInvoiceCalculations(formState.items);

  return (
    <div className="space-y-12 mt-6">
      {/* Configuration Section: Strategic Identity */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <Suspense fallback={<InvoiceFormSectionSkeleton className="h-24" />}>
            <CustomerSelector
              selectedCustomer={formState.selectedCustomer}
              onSelect={actions.setSelectedCustomer}
              companyId={companyId}
            />
          </Suspense>
        </div>
        
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Label className="text-2xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 pl-1">
            <FileText size={12} />
            Identificador Fiscal
          </Label>
          <div className="relative group">
             <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <select
                value={formState.series}
                onChange={(e) => actions.setSeries(e.target.value)}
                className="relative h-14 w-full cursor-pointer appearance-none rounded-2xl border border-border bg-card/80 px-6 font-mono text-label font-black text-foreground shadow-md shadow-black/5 backdrop-blur-md transition-[background-color,border-color,box-shadow,color] focus:outline-none focus:border-primary/50 hover:bg-card"
              >
                <option value="F001">F001 · Factura Electrónica</option>
                <option value="B001">B001 · Boleta de Venta</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity text-primary">
                 <svg width="12" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
          </div>
        </div>
      </div>

      {/* Temporal & Fiscal Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Suspense fallback={<InvoiceFormSectionSkeleton className="h-20" />}>
          <InvoiceDateFields
            dueDate={formState.dueDate}
            issueDate={formState.issueDate}
            onDueDateChange={actions.setDueDate}
            onIssueDateChange={actions.setIssueDate}
          />
        </Suspense>

        {/* Currency Selection */}
        <div className="space-y-4">
           <Label className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2 pl-1">
             <Globe size={12} className="text-[var(--premium-success)]" />
             Moneda de Operación
           </Label>
           <div className="relative group">
              <div className="absolute inset-0 bg-[rgba(var(--premium-success-rgb),0.05)] rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <select 
                value={formState.currency} 
                onChange={(e) => actions.setCurrency(e.target.value as InvoiceCurrency)} 
                className="relative h-14 w-full cursor-pointer appearance-none rounded-2xl border border-border bg-card/80 px-6 font-mono text-label font-black text-foreground shadow-md shadow-black/5 backdrop-blur-md transition-[background-color,border-color,box-shadow,color] focus:outline-none focus:border-[rgba(var(--premium-success-rgb),0.50)] hover:bg-card"
              >
                <option value="PEN">PEN · Soles Peruanos</option>
                <option value="USD">USD · Dólares Americanos</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity text-[var(--premium-success)]">
                 <svg width="12" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
           </div>
        </div>
      </div>

      {/* Decorative Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent my-12" />

      {/* Line Items: Strategic Detail */}
      <Suspense fallback={<InvoiceFormSectionSkeleton className="h-64" />}>
        <InvoiceLineItems
          items={formState.items}
          onAdd={actions.addItem}
          onRemove={actions.removeItem}
          onUpdate={actions.updateItem}
          currency={formState.currency}
        />
      </Suspense>

      {/* Final Layout: Financial Summary & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
        <div className="space-y-4">
          <Label className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2 pl-1">Notas y Glosas</Label>
          <Textarea 
            placeholder="Información adicional relevante para la auditoría cognitiva..." 
            value={formState.notes}
            onChange={(e) => actions.setNotes(e.target.value)}
            className="h-full min-h-[180px] resize-none rounded-2xl border-border bg-card/80 p-6 font-sans text-sm font-medium leading-relaxed shadow-md shadow-black/5 backdrop-blur-md transition-[background-color,border-color,box-shadow,color] focus:border-primary/40 placeholder:text-muted-foreground/70"
          />
        </div>
        <Suspense fallback={<InvoiceFormSectionSkeleton className="min-h-[320px]" />}>
          <InvoiceTotals totals={totals} currency={formState.currency} />
        </Suspense>
      </div>

      {/* Execution Controls: High-Stakes Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-6 pt-12 border-t border-border/70 mt-12">
        <Button 
          variant="ghost" 
          onClick={onCancel} 
          disabled={formState.isPending} 
          className="order-2 h-14 rounded-2xl px-12 font-black text-label uppercase tracking-[0.2em] text-muted-foreground transition-[background-color,color,box-shadow] hover:bg-muted/70 hover:text-foreground sm:order-1"
        >
          <X size={16} className="mr-3 opacity-60" /> Abortar Operación
        </Button>
        <Button 
          onClick={actions.handleSubmit} 
          disabled={formState.isPending} 
          className="order-1 h-14 rounded-2xl bg-primary px-12 font-black text-label uppercase tracking-[0.2em] text-primary-foreground shadow-xl shadow-primary/15 transition-[background-color,box-shadow,transform] hover:bg-primary/90 hover:shadow-primary/20 active:scale-[0.99] sm:order-2"
        >
          {formState.isPending ? (
             <span className="flex items-center gap-4 animate-pulse">
               <div className="w-2.5 h-2.5 rounded-full bg-current animate-bounce" />
               Emitiendo Documento...
             </span>
          ) : (
             <span className="flex items-center gap-4"><Save size={16} strokeWidth={3} /> Confirmar y Emitir</span>
          )}
        </Button>
      </div>
    </div>
  );
};

function InvoiceFormSectionSkeleton({ className }: { className: string }) {
  return (
    <div
      aria-label="Cargando sección de factura"
      className={`rounded-2xl border border-border/60 bg-card/60 ${className}`}
      role="status"
    >
      <span className="sr-only">Cargando sección de factura</span>
    </div>
  );
}
