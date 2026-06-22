"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactElement } from "react";
import { DrenyraCommandCenterMockup } from "@/components/drenyra/drenyra-command-center-mockup";
import {
	DrenyraCapabilitiesSection,
	DrenyraFlowSection,
	DrenyraProblemSection,
	DrenyraTrustSection,
	DrenyraUseCasesSection,
} from "@/components/drenyra/drenyra-reference-sections";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

const trustSignals = ["SUNAT", "SIRE", "IGV", "CDR", "Human approval"] as const;
const proofCards = [
	{
		title: "El problema",
		body: "El cierre mensual se rompe cuando la evidencia vive dispersa.",
	},
	{
		title: "Compliance-first",
		body: "La IA opera bajo reglas, compuertas y trazabilidad fiscal.",
	},
	{
		title: "Drenyra",
		body: "Un command center para decidir con contexto y prueba.",
	},
	{
		title: "Confianza",
		body: "Tenant, RUC, aprobaciones y expediente desde el diseño.",
	},
] as const;

export function DrenyraPage(): ReactElement {
	return (
		<>
			<section className="relative overflow-hidden border-b border-border/25 bg-background px-6 pb-20 pt-32 sm:px-8 md:pb-28 md:pt-40 lg:px-10">
				<div
					className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(var(--primary-rgb),0.16),transparent_32%)]"
					aria-hidden
				/>
				<div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
					<div>
						<ScrollReveal>
							<p className="text-xs font-black uppercase tracking-[0.32em] text-primary">
								Drenyra · Fiscal command center
							</p>
						</ScrollReveal>
						<ScrollReveal delay={0.08}>
							<h1 className="mt-6 max-w-4xl text-balance text-5xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl xl:text-8xl">
								Cierra, valida y declara con evidencia fiscal.
							</h1>
						</ScrollReveal>
						<ScrollReveal delay={0.16}>
							<p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
								Arkelythex convierte CPE, SIRE, bancos, reglas SUNAT y revisión
								humana en un command center auditable para estudios contables y
								empresas peruanas.
							</p>
						</ScrollReveal>
						<ScrollReveal delay={0.24}>
							<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<Link
									href="/demo"
									className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
								>
									Ver Drenyra en acción{" "}
									<ArrowRight className="h-4 w-4" aria-hidden />
								</Link>
								<Link
									href="/docs/api"
									className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border/45 bg-card/60 px-5 py-3 text-sm font-black text-foreground transition-colors hover:bg-card"
								>
									Explorar API fiscal
								</Link>
							</div>
						</ScrollReveal>
						<ScrollReveal delay={0.32}>
							<div className="mt-10 flex flex-wrap gap-2 border-t border-border/30 pt-5">
								{trustSignals.map((signal) => (
									<span
										key={signal}
										className="rounded-full border border-border/35 bg-card/55 px-3 py-1 text-2xs font-black uppercase tracking-[0.18em] text-muted-foreground"
									>
										{signal}
									</span>
								))}
							</div>
						</ScrollReveal>
					</div>
					<ScrollReveal delay={0.12}>
						<DrenyraCommandCenterMockup />
					</ScrollReveal>
				</div>
			</section>

			<section className="border-b border-border/25 bg-card/40 px-6 py-10 sm:px-8 lg:px-10">
				<div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
					{proofCards.map((card) => (
						<div
							key={card.title}
							className="rounded-2xl border border-border/30 bg-background/55 p-5"
						>
							<h2 className="text-sm font-black uppercase tracking-[0.16em] text-primary">
								{card.title}
							</h2>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
								{card.body}
							</p>
						</div>
					))}
				</div>
			</section>

			<DrenyraProblemSection />
			<DrenyraFlowSection />
			<DrenyraCapabilitiesSection />
			<DrenyraUseCasesSection />
			<DrenyraTrustSection />
		</>
	);
}
