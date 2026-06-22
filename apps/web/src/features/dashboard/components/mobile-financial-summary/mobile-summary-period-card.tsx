import { LiquidGlassCard } from "@/components/ui/liquid-glass";
import { Text } from "@/components/atoms/text";

export function MobileSummaryPeriodCard() {
  return (
    <div className="relative z-20 -mt-12 px-6">
      <LiquidGlassCard animate={false} intensity="medium" className="relative rounded-3xl p-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[rgba(var(--premium-info-rgb),0.16)] blur-2xl" />

        <div className="mb-6">
          <Text variant="label" className="mb-2 block uppercase tracking-[0.14em] text-[var(--premium-text-secondary)]">
            Periodo Fiscal
          </Text>
          <Text variant="hero" className="text-3xl font-bold tracking-tight">
            Aug 2026
          </Text>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(255,255,255,0.72)] shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              <Text variant="label" className="uppercase tracking-[0.12em] text-[var(--premium-text-secondary)]">
                Proyectado
              </Text>
            </div>
            <Text variant="data" className="text-xl">
              S/ 1,250,000.00
            </Text>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[rgba(var(--premium-info-rgb),0.92)] shadow-[0_0_12px_rgba(var(--premium-info-rgb),0.32)]" />
              <Text variant="label" className="uppercase tracking-[0.12em] text-[var(--premium-text-secondary)]">
                Flujo real
              </Text>
            </div>
            <Text variant="data" className="text-xl">
              S/ 1,121,182.37
            </Text>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex flex-col gap-0.5">
              <Text variant="label" className="uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                Desviacion
              </Text>
              <Text variant="data" className="text-2xl text-[var(--color-sunat-success)]">
                11.5%
              </Text>
            </div>

            <div className="ui-card-surface flex h-14 w-14 items-center justify-center rounded-2xl border-white/10">
              <div className="h-1.5 w-7 rounded-full bg-[var(--text-tertiary)] opacity-50" />
            </div>
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}
