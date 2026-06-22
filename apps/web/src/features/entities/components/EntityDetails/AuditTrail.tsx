import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck, History } from 'lucide-react';

interface AuditTrailProps {
  entityId: string;
}

export const AuditTrail = ({ entityId }: AuditTrailProps) => {
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-card">
      <CardHeader className="p-6 border-b border-border/50">
        <CardTitle className="text-xs font-black uppercase tracking-widest">Trazabilidad</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-4 items-start relative">
          <div className="h-full w-px bg-border absolute left-4 top-8" />
          <div className="h-8 w-8 rounded-full bg-foreground/10 border border-foreground/20 flex items-center justify-center shrink-0 z-10">
            <ShieldCheck size={14} className="text-[var(--premium-success)]" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-tight">Validación confirmada</p>
            <p className="text-label text-muted-foreground mt-1">Se corroboró el estado ACTIVO y HABIDO en la verificación fiscal.</p>
            <p className="text-xs font-bold text-muted-foreground mt-2 uppercase">Hoy • 09:15 AM</p>
          </div>
        </div>
        <div className="flex gap-4 items-start">
          <div className="h-8 w-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 z-10 text-primary">
            <History size={14} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-tight">Asiento registrado</p>
            <p className="text-label text-muted-foreground mt-1">Entidad {entityId.slice(0, 8)} conciliada contra operación BCP #TR-99218.</p>
            <p className="text-xs font-bold text-muted-foreground mt-2 uppercase">Ayer • 04:30 PM</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
