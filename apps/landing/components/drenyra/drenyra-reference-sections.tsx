import {
	ArrowRight,
	FileSearch,
	LockKeyhole,
	Network,
	ShieldCheck,
	Sparkles,
	Workflow,
} from "lucide-react";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

const problemCards = [
	{
		title: "Datos fragmentados",
		body: "CPE, bancos, SIRE, hojas de cálculo y correos viven separados justo cuando el cierre exige una sola verdad.",
	},
	{
		title: "Riesgo invisible",
		body: "Las diferencias de IGV aparecen tarde, sin priorización por impacto ni responsable claro para resolverlas.",
	},
	{
		title: "Evidencia débil",
		body: "La auditoría necesita trazas, hashes, aprobaciones y criterio humano; no capturas sueltas al final del mes.",
	},
] as const;

const flow = [
	{
		title: "Ingesta",
		body: "CPE, SIRE, bancos y documentos entran con RUC, periodo y origen.",
	},
	{
		title: "Validación",
		body: "Reglas SUNAT y dominio fiscal contrastan montos, IGV y estados.",
	},
	{
		title: "Riesgo",
		body: "Drenyra ordena excepciones por impacto y urgencia de cierre.",
	},
	{
		title: "Aprobación",
		body: "Acciones sensibles pasan por compuerta humana visible.",
	},
	{
		title: "Expediente",
		body: "Cada decisión queda con TraceId, evidencia y exportación auditada.",
	},
] as const;

const capabilities = [
	{
		name: "Eviden",
		body: "Recolecta comprobantes, CDR, registros y pruebas para cerrar con respaldo.",
	},
	{
		name: "Vigila",
		body: "Detecta señales de riesgo tributario antes de que lleguen a SUNAT.",
	},
	{
		name: "Traza",
		body: "Une decisiones, usuarios, cambios y fuentes en una línea auditable.",
	},
	{
		name: "Regula",
		body: "Mantiene reglas por país y periodo sin perder contexto operativo.",
	},
] as const;

const useCases = [
	{
		title: "Estudio contable multi-RUC",
		body: "Clientes, periodos y aprobaciones en una sala fiscal central.",
	},
	{
		title: "Retail y distribución",
		body: "Alto volumen de CPE conciliado contra SIRE y operación por sede.",
	},
	{
		title: "Fintech y servicios",
		body: "APIs, RUC, riesgo, evidencia y auditoría para equipos regulados.",
	},
	{
		title: "Dirección financiera",
		body: "Resumen ejecutivo sin perder detalle técnico del cierre.",
	},
] as const;

type ReferenceRevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
};

function ReferenceReveal({
	children,
	className,
}: ReferenceRevealProps): ReactElement {
	return <div className={className}>{children}</div>;
}

const controls = [
	{
		icon: ShieldCheck,
		title: "Human-in-the-loop",
		body: "Las decisiones fiscales sensibles no se automatizan a ciegas.",
	},
	{
		icon: LockKeyhole,
		title: "Tenant + RUC scoping",
		body: "Cada vista, consulta y expediente preserva aislamiento operativo.",
	},
	{
		icon: FileSearch,
		title: "Evidence by default",
		body: "La prueba no es un extra: es parte del flujo principal.",
	},
] as const;

function SectionLabel({ children }: { children: string }): ReactElement {
	return (
		<p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
			{children}
		</p>
	);
}

function ArchitecturalPlate({ index }: { index: number }): ReactElement {
	return (
		<div className="relative h-44 overflow-hidden rounded-3xl border border-border/35 bg-card shadow-sm shadow-black/5">
			<div
				className="absolute inset-0 bg-[radial-gradient(circle_at_35%_20%,rgba(var(--primary-rgb),0.22),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.72),rgba(23,18,13,0.04))]"
				aria-hidden
			/>
			<div
				className="absolute bottom-0 left-1/2 h-36 w-36 -translate-x-1/2 rounded-t-full border border-border/40 bg-background/45"
				aria-hidden
			/>
			<div
				className="absolute bottom-5 left-5 right-5 h-px bg-border/45"
				aria-hidden
			/>
			<div className="absolute right-6 top-6 grid h-14 w-14 place-items-center rounded-full border border-primary/35 bg-primary/10 text-sm font-black text-primary">
				0{index}
			</div>
		</div>
	);
}

export function DrenyraProblemSection(): ReactElement {
	return (
		<section className="border-t border-border/25 py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
				<ReferenceReveal>
					<SectionLabel>01 El problema</SectionLabel>
				</ReferenceReveal>
				<ReferenceReveal delay={0.1}>
					<h2 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
						El cierre fiscal todavía se arma como una obra sin planos.
					</h2>
				</ReferenceReveal>
				<div className="mt-10 grid gap-4 md:grid-cols-3">
					{problemCards.map((card, index) => (
						<ReferenceReveal key={card.title} delay={index * 0.06}>
							<div className="min-h-60 rounded-3xl border border-border/35 bg-card/65 p-6 shadow-sm shadow-black/5">
								<p className="text-sm font-black text-primary">0{index + 1}</p>
								<h3 className="mt-8 text-2xl font-black tracking-tight">
									{card.title}
								</h3>
								<p className="mt-4 text-sm leading-relaxed text-muted-foreground">
									{card.body}
								</p>
							</div>
						</ReferenceReveal>
					))}
				</div>
			</div>
		</section>
	);
}

export function DrenyraFlowSection(): ReactElement {
	return (
		<section className="border-t border-border/25 bg-card/35 py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
				<ReferenceReveal>
					<SectionLabel>02 AI-first, pero compliance-first</SectionLabel>
				</ReferenceReveal>
				<ReferenceReveal delay={0.1}>
					<h2 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
						La IA propone; el expediente fiscal sostiene la decisión.
					</h2>
				</ReferenceReveal>
				<div className="mt-12 grid gap-3 lg:grid-cols-5">
					{flow.map((item, index) => (
						<ReferenceReveal key={item.title} delay={index * 0.05}>
							<div className="h-full rounded-3xl border border-border/35 bg-background/70 p-5">
								<Workflow className="h-5 w-5 text-primary" aria-hidden />
								<p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
									0{index + 1}
								</p>
								<h3 className="mt-3 text-xl font-black tracking-tight">
									{item.title}
								</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									{item.body}
								</p>
							</div>
						</ReferenceReveal>
					))}
				</div>
			</div>
		</section>
	);
}

export function DrenyraCapabilitiesSection(): ReactElement {
	return (
		<section className="border-t border-border/25 py-20 md:py-28">
			<div className="mx-auto grid max-w-6xl gap-12 px-6 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
				<div>
					<ReferenceReveal>
						<SectionLabel>03 Drenyra</SectionLabel>
					</ReferenceReveal>
					<ReferenceReveal delay={0.1}>
						<h2 className="mt-5 text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
							Un sistema operativo para evidencia fiscal.
						</h2>
					</ReferenceReveal>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					{capabilities.map((item, index) => (
						<ReferenceReveal key={item.name} delay={index * 0.06}>
							<div className="rounded-3xl border border-border/35 bg-card/65 p-6">
								<Sparkles className="h-5 w-5 text-primary" aria-hidden />
								<h3 className="mt-8 text-2xl font-black tracking-tight">
									{item.name}
								</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									{item.body}
								</p>
							</div>
						</ReferenceReveal>
					))}
				</div>
			</div>
		</section>
	);
}

export function DrenyraUseCasesSection(): ReactElement {
	return (
		<section className="border-t border-border/25 bg-card/35 py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
				<ReferenceReveal>
					<SectionLabel>04 Casos de uso · Perú</SectionLabel>
				</ReferenceReveal>
				<ReferenceReveal delay={0.1}>
					<h2 className="mt-5 max-w-4xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
						Hecho para equipos que viven SUNAT cada mes.
					</h2>
				</ReferenceReveal>
				<div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
					{useCases.map((item, index) => (
						<ReferenceReveal key={item.title} delay={index * 0.06}>
							<article className="h-full overflow-hidden rounded-3xl border border-border/35 bg-background/75">
								<ArchitecturalPlate index={index + 1} />
								<div className="p-5">
									<h3 className="text-xl font-black tracking-tight">
										{item.title}
									</h3>
									<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
										{item.body}
									</p>
								</div>
							</article>
						</ReferenceReveal>
					))}
				</div>
			</div>
		</section>
	);
}

export function DrenyraTrustSection(): ReactElement {
	return (
		<section className="border-t border-border/25 py-20 md:py-28">
			<div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-10">
				<ReferenceReveal>
					<SectionLabel>05 Controles de confianza</SectionLabel>
				</ReferenceReveal>
				<div className="mt-10 grid gap-4 md:grid-cols-3">
					{controls.map(({ icon: Icon, ...item }, index) => (
						<ReferenceReveal key={item.title} delay={index * 0.06}>
							<div className="rounded-3xl border border-border/35 bg-card/65 p-6">
								<Icon className="h-6 w-6 text-primary" aria-hidden />
								<h3 className="mt-8 text-2xl font-black tracking-tight">
									{item.title}
								</h3>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									{item.body}
								</p>
							</div>
						</ReferenceReveal>
					))}
				</div>
				<ReferenceReveal delay={0.2}>
					<div className="mt-16 grid overflow-hidden rounded-4xl border border-border/35 bg-foreground text-background lg:grid-cols-[1fr_0.85fr]">
						<div className="p-8 md:p-12">
							<p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
								Demo fiscal
							</p>
							<h2 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
								Entrá a Drenyra con un cierre real, no con slides.
							</h2>
							<p className="mt-6 max-w-xl text-sm leading-relaxed text-background/70 md:text-base">
								Traé un caso SUNAT, un periodo y una preocupación. La demo
								muestra evidencia, compuertas y trazas como operaría tu equipo.
							</p>
							<Link
								href="/demo"
								className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground"
							>
								Ver demo <ArrowRight className="h-4 w-4" aria-hidden />
							</Link>
						</div>
						<div className="relative min-h-80 overflow-hidden bg-background/10">
							<div
								className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-t-full border border-background/25"
								aria-hidden
							/>
							<div className="absolute inset-x-8 bottom-12 grid gap-3">
								{[0, 1, 2, 3].map((item) => (
									<div
										key={item}
										className="h-10 rounded-full border border-background/20 bg-background/5"
									/>
								))}
							</div>
							<Network
								className="absolute right-10 top-10 h-12 w-12 text-primary"
								aria-hidden
							/>
						</div>
					</div>
				</ReferenceReveal>
			</div>
		</section>
	);
}
