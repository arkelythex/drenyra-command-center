/**
 * DemoShowcase — Galería de Casos de Éxito ARKELYTHEX
 *
 * Muestra los 3 demos scripted con reproducción en tiempo real via SSE.
 * Ideal para: onboarding, marketing, presentaciones a inversores (ProInnóvate).
 *
 * Uso en rutas:
 *   /onboarding/demos                  — galería de los 3 demos
 *   /onboarding/demos?play=igv-error   — reproduce un demo automáticamente
 */

import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { DemoCard } from "./demos/demo-card";
import { DemoPlayer } from "./demos/demo-player";
import { DEMO_CARDS } from "./demos/demo-showcase.data";
import type { DemoId } from "./demos/demo-showcase.types";

interface DemoShowcaseProps {
	autoPlayId?: DemoId;
	onComplete?: () => void;
}

export const DemoShowcase = ({ autoPlayId, onComplete }: DemoShowcaseProps) => {
	const [activeDemo, setActiveDemo] = useState<DemoId | null>(
		autoPlayId ?? null,
	);

	return (
		<>
			{activeDemo ? (
				<DemoPlayer demoId={activeDemo} onClose={() => setActiveDemo(null)} />
			) : null}

			<section className="w-full space-y-8">
				<div className="space-y-3 text-center">
					<div className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-foreground/5 px-3 py-1.5">
						<Sparkles size={12} className="text-foreground/50" />
						<span className="text-3xs font-black uppercase tracking-[0.3em] text-muted-foreground">
							Casos reales · Normativa SUNAT 2026
						</span>
					</div>

					<h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
						Lo que ARKELYTHEX hace
					</h2>
					<p className="mx-auto max-w-md text-sm text-muted-foreground">
						Tres escenarios reales que demuestran cómo el enjambre de agentes
						protege tu empresa de multas, errores y pérdidas fiscales.
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{DEMO_CARDS.map((demo) => (
						<DemoCard key={demo.id} demo={demo} onOpen={setActiveDemo} />
					))}
				</div>

				{onComplete ? (
					<div className="flex justify-center pt-4">
						<button
							onClick={onComplete}
							className="flex items-center gap-3 rounded-2xl border border-border/20 bg-foreground/5 px-8 py-4 text-sm font-black uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,box-shadow] hover:bg-foreground/10 hover:text-foreground"
						>
							Continuar configuración
							<ArrowRight size={16} />
						</button>
					</div>
				) : null}
			</section>
		</>
	);
};
