import { motion } from 'framer-motion';
import { Shield, UserCheck, Bot, Cpu, CircleHelp, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutonomyDialProps {
  currentLevel: number;
  onLevelChange: (level: number) => void;
}

const levels = [
  { id: 1, label: 'ASISTENTE', icon: UserCheck, desc: 'Solo sugiere, no ejecuta.', color: 'text-muted-foreground' },
  { id: 2, label: 'COLABORADOR', icon: Shield, desc: 'Ejecuta con confirmación doble.', color: 'text-[var(--premium-action-cyan)]' },
  { id: 3, label: 'CO-PILOTO', icon: Bot, desc: 'Prepara acciones y solicita confirmación.', color: 'text-[var(--premium-success)]' },
  { id: 4, label: 'SUPERVISADO', icon: Cpu, desc: 'Ejecuta solo dentro de compuertas aprobadas.', color: 'text-[var(--premium-action-cyan)]' },
  { id: 5, label: 'REVIEW-GATED', icon: ClipboardCheck, desc: 'Propone cambios críticos y exige aprobación humana.', color: 'text-amber-300' },
];

export const AutonomyDial = ({ currentLevel, onLevelChange }: AutonomyDialProps) => {
  const activeLevel = levels[currentLevel - 1];

  return (
    <div className="h-full rounded-xl border border-border bg-card p-5 transition-colors">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-label font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Nivel de Control
          </span>
          <button
            type="button"
            aria-label="Información sobre niveles de control"
            title="Define qué acciones puede preparar Drenyra y cuáles requieren aprobación humana."
            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:text-muted-foreground"
          >
            <CircleHelp size={12} />
          </button>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 transition-colors",
          activeLevel.color
        )}>
           <activeLevel.icon size={10} />
           <span className="text-3xs font-black">{activeLevel.label}</span>
        </div>
      </div>

      <div className="flex h-12 items-end justify-between gap-1.5">
        {levels.map((lvl) => (
          <button
            key={lvl.id}
            onClick={() => onLevelChange(lvl.id)}
            aria-label={`${lvl.label}: ${lvl.desc}`}
            className="flex-1 group/btn relative"
          >
            <motion.div
              animate={{
                height: currentLevel >= lvl.id ? (lvl.id * 8 + 8) : 8,
                opacity: currentLevel >= lvl.id ? 1 : 0.2
              }}
              className={cn(
                "w-full rounded-full transition-[background-color,height,opacity,box-shadow] duration-300",
                currentLevel >= lvl.id ? "bg-foreground/70" : "bg-muted-foreground/30 hover:bg-muted-foreground/45"
              )}
            />
          </button>
        ))}
      </div>

      <p className="mt-3 text-3xs font-medium leading-tight text-muted-foreground/80">
        {activeLevel.desc}
      </p>
    </div>
  );
};
