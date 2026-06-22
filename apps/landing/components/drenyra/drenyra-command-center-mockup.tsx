import {
	Archive,
	BadgeCheck,
	Bot,
	Building2,
	CheckCircle2,
	FileCheck2,
	Fingerprint,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import type { ReactElement } from "react";

const kpis = [
	{
		label: "Salud fiscal",
		value: "94%",
		meta: "cierre mayo",
		tone: "text-success",
	},
	{
		label: "Inconsistencias IGV",
		value: "18",
		meta: "3 críticas",
		tone: "text-warning",
	},
	{
		label: "RVIE / RCE",
		value: "SIRE",
		meta: "sync hace 4 min",
		tone: "text-primary",
	},
	{
		label: "CPE conciliados",
		value: "1,245",
		meta: "96.8% match",
		tone: "text-accent-foreground",
	},
] as const;

const flow = [
	"CPE + bancos",
	"Validación SUNAT",
	"Riesgo priorizado",
	"Aprobación humana",
	"Expediente",
] as const;

const sidebarIcons = [
	{ label: "Security", icon: ShieldCheck },
	{ label: "Documents", icon: FileCheck2 },
	{ label: "Agent", icon: Bot },
	{ label: "Archive", icon: Archive },
] as const;

const evidence = [
	{ title: "Factura F001-8841", meta: "IGV verificado · TraceId A9F" },
	{ title: "Registro RVIE", meta: "Diferencia menor aprobada" },
	{ title: "CDR adjunto", meta: "Hash SHA-256 preservado" },
] as const;

function MetricCard({
	label,
	value,
	meta,
	tone,
}: (typeof kpis)[number]): ReactElement {
	return (
		<div className="rounded-2xl border border-border/40 bg-card/75 p-4 shadow-sm shadow-black/5">
			<p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
				{label}
			</p>
			<div className="mt-3 flex items-end justify-between gap-3">
				<p className={`text-2xl font-black tracking-tight ${tone}`}>{value}</p>
				<BadgeCheck className="h-4 w-4 text-primary" aria-hidden />
			</div>
			<p className="mt-2 text-xs font-medium text-muted-foreground">{meta}</p>
		</div>
	);
}

export function DrenyraCommandCenterMockup(): ReactElement {
	return (
		<div className="relative mx-auto max-w-[640px]">
			<div
				className="absolute -inset-5 rounded-4xl bg-primary/10 blur-3xl"
				aria-hidden
			/>
			<div className="relative overflow-hidden rounded-[1.75rem] border border-border/50 bg-card/90 p-3 shadow-2xl shadow-primary/20 backdrop-blur">
				<div className="flex overflow-hidden rounded-[1.35rem] border border-border/35 bg-background/55">
					<aside className="hidden w-16 shrink-0 flex-col items-center gap-4 border-r border-border/35 bg-foreground px-3 py-5 text-background sm:flex">
						<div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
							<Building2 className="h-4 w-4" aria-hidden />
						</div>
						{sidebarIcons.map(({ label, icon: Icon }) => (
							<div
								key={label}
								className="grid h-8 w-8 place-items-center rounded-xl border border-background/15 text-background/70"
							>
								<Icon className="h-4 w-4" aria-hidden />
							</div>
						))}
					</aside>

					<div className="min-w-0 flex-1 p-4 sm:p-5">
						<header className="flex flex-col gap-4 border-b border-border/35 pb-4 md:flex-row md:items-start md:justify-between">
							<div>
								<p className="text-2xs font-black uppercase tracking-[0.22em] text-primary">
									Drenyra workspace
								</p>
								<h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
									Cierre fiscal · Mayo 2026
								</h2>
								<p className="mt-1 text-xs font-medium text-muted-foreground">
									RUC 2060••••11 · Lima · Operador humano requerido
								</p>
							</div>
							<button
								type="button"
								className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-[0.16em] text-primary-foreground shadow-lg shadow-primary/20"
							>
								Sincronizar SIRE
							</button>
						</header>

						<section
							className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
							aria-label="Indicadores fiscales"
						>
							{kpis.map((kpi) => (
								<MetricCard key={kpi.label} {...kpi} />
							))}
						</section>

						<section className="mt-4 rounded-3xl border border-border/40 bg-card/70 p-4">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
										Flujo auditable
									</p>
									<h3 className="mt-1 text-lg font-black tracking-tight">
										Validación antes de declarar
									</h3>
								</div>
								<Fingerprint className="h-5 w-5 text-primary" aria-hidden />
							</div>
							<div className="mt-5 grid gap-3 md:grid-cols-5">
								{flow.map((step, index) => (
									<div
										key={step}
										className="relative rounded-2xl border border-border/35 bg-background/55 p-3"
									>
										<p className="text-2xs font-black text-primary">
											0{index + 1}
										</p>
										<p className="mt-2 text-xs font-bold leading-snug">
											{step}
										</p>
									</div>
								))}
							</div>
						</section>

						<div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
							<section className="rounded-3xl border border-border/40 bg-card/70 p-4">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
									<h3 className="text-sm font-black uppercase tracking-[0.12em]">
										Aprobación humana
									</h3>
								</div>
								<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
									Drenyra recomienda bloquear exportación hasta revisar 3 CPE
									con IGV sensible.
								</p>
								<div className="mt-4 flex gap-2">
									<span className="rounded-full bg-primary px-3 py-1 text-2xs font-black uppercase tracking-[0.14em] text-primary-foreground">
										Aprobar
									</span>
									<span className="rounded-full border border-border/45 px-3 py-1 text-2xs font-black uppercase tracking-[0.14em]">
										Pedir soporte
									</span>
								</div>
							</section>

							<section className="rounded-3xl border border-border/40 bg-foreground p-4 text-background">
								<div className="flex items-center gap-2">
									<Sparkles className="h-5 w-5 text-primary" aria-hidden />
									<h3 className="text-sm font-black uppercase tracking-[0.12em]">
										Evidence stack
									</h3>
								</div>
								<div className="mt-4 space-y-3">
									{evidence.map((item) => (
										<div
											key={item.title}
											className="rounded-2xl border border-background/15 bg-background/5 p-3"
										>
											<p className="text-xs font-black">{item.title}</p>
											<p className="mt-1 text-2xs font-medium text-background/65">
												{item.meta}
											</p>
										</div>
									))}
								</div>
							</section>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
