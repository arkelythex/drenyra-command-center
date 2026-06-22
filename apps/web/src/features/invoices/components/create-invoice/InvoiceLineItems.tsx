import { Plus, Trash2, Package, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvoiceItem } from './hooks/useInvoiceCalculations';
import { cn, n } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useHaptics } from '@/hooks/useHaptics';
import { LEGIBILITY } from '@/lib/legibility';

interface Props {
  items: InvoiceItem[];
  onUpdate: (id: string, field: keyof InvoiceItem, value: InvoiceItem[keyof InvoiceItem]) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  currency: string;
}

export const InvoiceLineItems = ({ items, onUpdate, onAdd, onRemove, currency }: Props) => {
  const { trigger } = useHaptics();

  const handleAdd = () => {
    trigger('light');
    onAdd();
  };

  const handleRemove = (id: string) => {
    trigger('error');
    onRemove(id);
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col gap-1">
            <Label className={cn("text-2xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2", LEGIBILITY.textShadow.light)}>
              <Package size={14} />
              Detalle de Operación
            </Label>
            <p className="text-label text-muted-foreground/60 font-medium uppercase tracking-tight">Listado de conceptos y servicios devengados</p>
        </div>
        
        <Button 
            size="sm" 
            variant="outline" 
            onClick={handleAdd} 
            className="h-11 rounded-2xl border-primary/20 bg-primary/10 px-6 text-2xs font-black uppercase tracking-widest text-primary shadow-md transition-[background-color,border-color,box-shadow,color] hover:bg-primary/20"
        >
          <Plus size={16} className="mr-2" strokeWidth={3} /> Agregar Concepto
        </Button>
      </div>

      <div className="space-y-8">
        {items.map((item) => {
          const subtotal = item.quantity * item.unitPrice;
          const igv = item.taxType === 'GRAVADO' ? subtotal * 0.18 : 0;
          const total = subtotal + igv;

          return (
            <div 
                key={item.id} 
                className="group relative overflow-hidden rounded-3xl border border-border bg-card/80 p-8 shadow-lg backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 hover:bg-card sm:p-10"
            >
              {/* Row Decorator: The "Elite" Touch */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="grid grid-cols-12 gap-8 items-end">
                <div className="col-span-12 lg:col-span-5 space-y-4">
                  <Label className={cn("text-2xs font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2 pl-1", LEGIBILITY.textShadow.light)}>
                    <Tag size={12} />
                    Descripción del Concepto
                  </Label>
                  <Input
                    placeholder="Especifique el servicio o bien transaccionado..."
                    value={item.description}
                    onChange={(e) => onUpdate(item.id, 'description', e.target.value)}
                    onFocus={() => trigger('light')}
                    className="h-14 bg-card/70 border-border font-sans text-sm font-semibold rounded-2xl px-6 focus:border-primary/40 shadow-inner"
                  />
                </div>
                
                <div className="col-span-6 md:col-span-2 space-y-4">
                  <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground/50 pl-1">Cantidad</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(e) => onUpdate(item.id, 'quantity', Number(e.target.value))}
                    onFocus={() => trigger('light')}
                    className="h-14 bg-card/70 border-border font-mono text-sm font-black text-right rounded-2xl px-5 focus:border-primary/40 shadow-inner"
                  />
                </div>

                <div className="col-span-6 md:col-span-2 space-y-4">
                   <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground/50 pl-1">P. Unitario ({currency})</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={item.unitPrice}
                    onChange={(e) => onUpdate(item.id, 'unitPrice', Number(e.target.value))}
                    onFocus={() => trigger('light')}
                    className="h-14 bg-card/70 border-border font-mono text-sm font-black text-right rounded-2xl px-5 focus:border-primary/40 shadow-inner"
                  />
                </div>

                <div className="col-span-10 md:col-span-2 space-y-4">
                   <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground/50 pl-1">Impuesto</Label>
                  <div className="relative group/sel">
                    <select
                        value={item.taxType}
                        onChange={(e) => onUpdate(item.id, 'taxType', e.target.value)}
                        onFocus={() => trigger('light')}
                        className="h-14 w-full cursor-pointer appearance-none rounded-2xl border border-border bg-card/70 px-5 font-mono text-label font-black text-foreground shadow-inner transition-[background-color,border-color,box-shadow,color] focus:outline-none focus:border-primary/40 hover:bg-muted/70"
                    >
                        <option value="GRAVADO">Gravado (18%)</option>
                        <option value="EXONERADO">Exonerado</option>
                        <option value="INAFECTO">Inafecto</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30 text-primary">
                         <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1 flex items-center justify-end">
                  <button 
                    onClick={() => handleRemove(item.id)} 
                    className="group/trash flex h-14 w-14 items-center justify-center rounded-2xl border border-transparent text-muted-foreground/40 shadow-sm transition-[background-color,border-color,color,box-shadow] hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 size={22} className="group-hover/trash:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Advanced Calculation Readout: Financial Precision */}
              <div className="flex flex-wrap items-center justify-end gap-x-12 gap-y-6 pt-8 border-t border-border/70 mt-2">
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-3xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Subtotal Operación</span>
                    <span className="font-mono text-sm font-black text-muted-foreground/80 tracking-tighter tabular-nums">{n(subtotal, currency as unknown as Parameters<typeof n>[1])}</span>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-3xs font-black uppercase tracking-[0.2em] text-muted-foreground/40">Carga Impositiva</span>
                    <span className="font-mono text-sm font-black text-muted-foreground/80 tracking-tighter tabular-nums">{n(igv, currency as unknown as Parameters<typeof n>[1])}</span>
                 </div>
                 <div className="flex flex-col items-end gap-1 pl-12 border-l border-border">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        <span className={cn("text-2xs font-black uppercase tracking-[0.2em] text-foreground", LEGIBILITY.textShadow.light)}>Total Concepto</span>
                    </div>
                    <span className={cn("font-mono text-2xl font-black text-foreground tabular-nums tracking-tighter", LEGIBILITY.textShadow.medium)}>
                        {n(total, currency as unknown as Parameters<typeof n>[1])}
                    </span>
                 </div>
              </div>
            </div>
          );
        })}
        
        {items.length === 0 && (
            <div 
                className="group flex cursor-pointer flex-col items-center justify-center rounded-4xl border-2 border-dashed border-border bg-card/60 py-24 backdrop-blur-sm transition-[background-color,border-color,box-shadow] hover:bg-card/80" 
                onClick={handleAdd}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAdd(); } }}
            >
                <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/5 text-primary shadow-xl transition-[background-color,transform,box-shadow] duration-300 group-hover:scale-105 group-hover:bg-primary/10">
                    <Plus className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <p className={cn("text-xs font-black text-foreground uppercase tracking-[0.3em] mb-3", LEGIBILITY.textShadow.light)}>Comprobante Vacío</p>
                <p className="text-label text-muted-foreground/60 uppercase tracking-widest font-bold max-w-xs text-center leading-relaxed">Inicie el detalle de bienes o servicios para la liquidación fiscal</p>
                <Button variant="outline" size="lg" onClick={(e) => { e.stopPropagation(); handleAdd(); }} className="mt-10 h-12 px-10 rounded-2xl border-primary/30 text-primary hover:bg-primary/10 font-black uppercase text-2xs tracking-[0.2em] shadow-xl">
                    + Registrar Primer Concepto
                </Button>
            </div>
        )}
      </div>
    </div>
  );
};
