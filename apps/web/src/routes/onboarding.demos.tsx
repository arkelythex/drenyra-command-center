/**
 * /onboarding/demos — Galería de Casos de Éxito ARKELYTHEX
 *
 * Ruta PÚBLICA (sin auth). Sirve para:
 *   - Onboarding de nuevos usuarios (ver las capacidades antes de configurar)
 *   - Pitch a inversores ProInnóvate (/onboarding/demos?play=igv-error)
 *   - Demo links en marketing/landing
 *
 * @example
 *   /onboarding/demos                      ← galería de 3 demos
 *   /onboarding/demos?play=igv-error       ← auto-play demo IGV
 *   /onboarding/demos?play=sire-auto       ← auto-play SIRE
 *   /onboarding/demos?play=detraccion-omitida
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { z } from 'zod';

const DemoShowcase = lazy(async () => {
  const mod = await import('../features/onboarding/components/DemoShowcase');
  return { default: mod.DemoShowcase };
});

const DEMO_IDS = ['igv-error', 'sire-auto', 'detraccion-omitida'] as const;

const demosSearchSchema = z.object({
  play: z.enum(DEMO_IDS).optional(),
});

export const Route = createFileRoute('/onboarding/demos')({
  validateSearch: (search) => demosSearchSchema.parse(search),
  component: OnboardingDemosPage,
});

function OnboardingDemosPage() {
  const { play } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <Suspense
          fallback={
            <div
              className="flex min-h-[360px] items-center justify-center rounded-3xl border border-border/60 bg-muted/20"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-8 w-8 animate-spin text-primary"
                aria-hidden="true"
              />
              <span className="sr-only">Cargando demos de onboarding</span>
            </div>
          }
        >
          <DemoShowcase
            autoPlayId={play}
            onComplete={() => navigate({ to: '/signup' })}
          />
        </Suspense>
      </div>
    </div>
  );
}
