/**
 * /onboarding/demos — Galería de Casos de Éxito ARKELYTHEX
 *
 * Ruta PÚBLICA (sin auth). Sirve para:
 *   - Onboarding de nuevos usuarios (ver las capacidades antes de configurar)
 *   - Pitch a inversores ProInnóvate (/onboarding/demos?play=igv-error)
 *   - Demo links en marketing/landing
 */

import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";

const DemoShowcase = lazy(async () => {
	const mod = await import("../features/onboarding/components/DemoShowcase");
	return { default: mod.DemoShowcase };
});

interface OnboardingDemosPageProps {
	play?: "igv-error" | "sire-auto" | "detraccion-omitida";
}

export default function OnboardingDemosPage({ play }: OnboardingDemosPageProps) {
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
						{...(play ? { autoPlayId: play } : {})}
						onComplete={() => navigate({ to: "/signup" })}
					/>
				</Suspense>
			</div>
		</div>
	);
}
