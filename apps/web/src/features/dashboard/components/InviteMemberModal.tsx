import React from 'react';
import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus, Mail, Shield, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { simulateLatency } from '@/lib/simulated-latency';

interface InviteMemberModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Role = 'ADMIN' | 'CONTADOR' | 'VISOR';

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('CONTADOR');
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInvite = () => {
    if (!email) return;

    startTransition(async () => {
      // Simulando llamada a Server Action en React 19
      await simulateLatency(1500);
      setIsSuccess(true);

      setTimeout(() => {
        onOpenChange(false);
        setTimeout(() => {
          setIsSuccess(false);
          setEmail('');
          setRole('CONTADOR');
        }, 180);
      }, 900);
    });
  };

  const roles: { id: Role, label: string, desc: string, color: string }[] = [
    { id: 'ADMIN', label: 'Administrador', desc: 'Acceso total a la configuración y finanzas.', color: 'text-foreground' },
    { id: 'CONTADOR', label: 'Contador', desc: 'Gestión de impuestos, SIRE y estados financieros.', color: 'text-primary' },
    { id: 'VISOR', label: 'Visor', desc: 'Solo lectura de reportes y documentos.', color: 'text-muted-foreground' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[1.75rem] border-border bg-[var(--surface-1)]/96 p-0 shadow-xl backdrop-blur-md sm:max-w-[520px]">
        {!isSuccess ? (
          <div className="relative z-10 p-8 sm:p-10">
            <DialogHeader className="mb-8 text-left sm:text-left">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/15 ring-4 ring-primary/5">
                <UserPlus size={28} strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-2xl font-black leading-none tracking-tighter text-foreground uppercase">Invitar Operador</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium mt-3 text-sm leading-relaxed">
                Asigne un nuevo nodo humano al equipo de inteligencia financiera de su organización.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="ml-1 text-2xs font-black uppercase tracking-[0.3em] text-primary">Canal de Acceso (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/40 transition-colors duration-200 group-focus-within:text-primary" />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operador@arkalythix.core"
                    className="ui-search-input h-12 w-full rounded-2xl pl-12 text-sm font-semibold text-foreground placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="ml-1 text-2xs font-black uppercase tracking-[0.3em] text-primary">Privilegios de Seguridad</label>
                <div className="grid grid-cols-1 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={cn(
                        "group relative flex items-center gap-4 overflow-hidden rounded-[1.25rem] border p-4 text-left transition-[background-color,border-color,box-shadow,transform,color] duration-200 active:scale-[0.98]",
                        role === r.id
                          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5 ring-1 ring-primary/10"
                          : "bg-card/60 border-border hover:bg-muted/70"
                      )}
                    >
                      <div className={cn(
                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-[background-color,color,box-shadow,transform] duration-200",
                        role === r.id ? "bg-primary text-primary-foreground shadow-primary/20" : "bg-muted/40 text-muted-foreground"
                      )}>
                        <Shield size={18} strokeWidth={2.5} />
                      </div>
                      <div className="relative z-10 flex-1">
                        <p className={cn("text-xs font-black uppercase tracking-widest", role === r.id ? "text-primary" : "text-foreground/70")}>{r.label}</p>
                        <p className="mt-1 text-2xs font-medium text-muted-foreground leading-snug">{r.desc}</p>
                      </div>
                      {role === r.id && (
                        <div className="absolute right-6 h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-10 flex items-center gap-5 border-t border-border pt-8 sm:justify-between">
              <button
                onClick={() => onOpenChange(false)}
                className="text-2xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 transition-[color,transform,opacity] duration-200 hover:text-foreground active:scale-90"
              >
                Abortar
              </button>
              <Button
                onClick={handleInvite}
                disabled={!email || isPending}
                className={cn(
                  "h-12 rounded-2xl px-10 text-label font-black uppercase tracking-[0.2em] shadow-xl transition-[background-color,box-shadow,transform,opacity] duration-200 disabled:opacity-50",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "hover:shadow-primary/30 active:scale-95"
                )}
              >
                {isPending ? (
                  <span className="flex items-center gap-3 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                    Transmitiendo...
                  </span>
                ) : (
                  "Emitir Invitación"
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="relative z-10 flex animate-entrance flex-col items-center p-16 text-center">
            <div className="mb-8 flex h-24 w-20 items-center justify-center rounded-2xl border border-success-subtle bg-success-subtle text-success shadow-success-glow ring-4 ring-[rgba(var(--premium-success-rgb),0.15)]">
              <CheckCircle2 size={48} strokeWidth={1.5} />
            </div>
            <h3 className="mb-4 text-2xl font-black uppercase tracking-tighter text-foreground">Nodo Sincronizado</h3>
            <p className="text-sm font-medium text-muted-foreground/70 leading-relaxed max-w-xs uppercase tracking-widest text-2xs">
              Protocolo de acceso enviado a <br /><span className="font-black text-success">{email}</span> con privilegios de {role}.
            </p>
          </div>
        )}

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -right-[10%] -top-[20%] h-[60%] w-[60%] bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-[20%] -left-[10%] h-[60%] w-[60%] bg-primary/5 blur-3xl" />
      </DialogContent>
    </Dialog>
  );
};
