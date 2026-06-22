"use client";

import { useId, useState } from "react";
import type { ReactElement } from "react";
import Link from "next/link";
import {
	ArrowRight,
	ArrowUpRight,
	Code,
	Terminal,
	BookOpen,
	Shield,
	FileText,
	Database,
	Search,
	ExternalLink,
	Github,
	MessageCircle,
	Check,
	Copy,
} from "lucide-react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
	LANDING_BODY_MUTED_CLASS,
	LANDING_CAPTION_CLASS,
	LANDING_DIVIDER_CLASS,
	LANDING_EYEBROW_CLASS,
} from "@/lib/landing/ui-classes";
import { cn } from "@/lib/utils";

const LANGUAGES = [
	{ id: "curl", label: "curl" },
	{ id: "python", label: "Python" },
	{ id: "node", label: "Node.js" },
	{ id: "go", label: "Go" },
	{ id: "php", label: "PHP" },
] as const;

type LanguageId = (typeof LANGUAGES)[number]["id"];

const CODE_SNIPPETS: Record<LanguageId, { lines: string[] }> = {
	curl: {
		lines: [
			"curl https://api.arkelythexfounders.com/v1/ruc/20600123456 \\",
			'  -H "Authorization: Bearer $ARKELYTHEX_API_KEY" \\',
			'  -H "Content-Type: application/json"',
			"",
			"# Respuesta:",
			"{",
			'  "ruc": "20600123456",',
			'  "razon_social": "Arkelythex S.A.C.",',
			'  "condicion": "Habido",',
			'  "estado": "Activo"',
			"}",
		],
	},
	python: {
		lines: [
			"import arkelythex",
			"",
			"client = arkelythex.Client(api_key='$ARKELYTHEX_API_KEY')",
			"",
			"ruc = client.ruc.consultar('20600123456')",
			"print(ruc.razon_social)   # Arkelythex S.A.C.",
			"print(ruc.condicion)      # Habido",
			"print(ruc.estado)         # Activo",
		],
	},
	node: {
		lines: [
			"import { ArkelythexClient } from '@arkelythex/sdk'",
			"",
			"const client = new ArkelythexClient({",
			"  apiKey: process.env.ARKELYTHEX_API_KEY ?? process.env.ARKALYTHIX_API_KEY",
			"})",
			"",
			"const ruc = await client.ruc.consultar('20600123456')",
			"console.log(ruc.razonSocial)  // Arkelythex S.A.C.",
			"console.log(ruc.condicion)     // Habido",
		],
	},
	go: {
		lines: [
			"package main",
			"",
			"import (",
			'  "fmt"',
			'  "github.com/arkalythix/sdk-go"',
			")",
			"",
			"func main() {",
			'  client := arkelythex.NewClient(os.Getenv("ARKELYTHEX_API_KEY"))',
			'  ruc, _ := client.RUC.Consultar("20600123456")',
			"  fmt.Println(ruc.RazonSocial) // Arkelythex S.A.C.",
			"}",
		],
	},
	php: {
		lines: [
			"use Arkelythex\\Client;",
			"",
			"$client = new Client('$ARKELYTHEX_API_KEY');",
			"",
			"$ruc = $client->ruc->consultar('20600123456');",
			"echo $ruc->razonSocial;  // Arkelythex S.A.C.",
			"echo $ruc->condicion;     // Habido",
		],
	},
};

const BUILD_PATHS = [
	{
		icon: Search,
		title: "Consultar RUC",
		description:
			"Consulta en tiempo real el estado, condición y actividad económica de cualquier RUC en SUNAT.",
		href: "#capability-ruc",
	},
	{
		icon: FileText,
		title: "Emitir CPE",
		description:
			"Emite, consulta y anula comprobantes electrónicos directamente desde tu aplicación.",
		href: "#capability-cpe",
	},
	{
		icon: Database,
		title: "Generar PLE / SIRE",
		description:
			"Endpoints para generar archivos PLE y SIRE validados. Sin software adicional ni descargas.",
		href: "#capability-sire",
	},
] as const;

const SDK_CARDS = [
	{
		name: "Python",
		desc: "arkelythex-sdk-python",
		repo: "https://github.com/arkalythix/sdk-python",
	},
	{
		name: "Node.js",
		desc: "@arkelythex/sdk",
		repo: "https://github.com/arkalythix/sdk-node",
	},
	{
		name: "Go",
		desc: "github.com/arkalythix/sdk-go",
		repo: "https://github.com/arkalythix/sdk-go",
	},
	{
		name: "PHP",
		desc: "arkelythex/sdk-php",
		repo: "https://github.com/arkalythix/sdk-php",
	},
] as const;

const CAPABILITIES = [
	{
		id: "ruc",
		icon: Search,
		title: "Consultar RUC",
		desc: "RUC lookup en tiempo real con condición, estado, actividad y domicilio fiscal.",
	},
	{
		id: "cpe",
		icon: FileText,
		title: "Emitir CPE",
		desc: "Emisión, consulta y anulación de facturas, boletas, notas de crédito/débito.",
	},
	{
		id: "ple",
		icon: Database,
		title: "PLE",
		desc: "Generación de archivos PLE (Registro de Ventas, Compras, Libro Diario) validados.",
	},
	{
		id: "sire",
		icon: Shield,
		title: "SIRE",
		desc: "Generación y envío de archivos SIRE sincronizados con SUNAT.",
	},
	{
		id: "calendario",
		icon: BookOpen,
		title: "Calendario",
		desc: "Calendario tributario con fechas de vencimiento y obligaciones por RUC.",
	},
	{
		id: "webhooks",
		icon: Code,
		title: "Webhooks",
		desc: "Eventos en tiempo real cuando SUNAT actualiza estado de tus comprobantes.",
	},
] as const;

const RESOURCES = [
	{
		icon: MessageCircle,
		title: "Soporte técnico",
		desc: "Resolvemos dudas de integración",
		href: "/demo",
	},
	{
		icon: Github,
		title: "GitHub",
		desc: "SDKs open source y ejemplos",
		href: "https://github.com/arkalythix",
		external: true,
	},
	{
		icon: Terminal,
		title: "API Reference",
		desc: "Capacidades y endpoints en esta página",
		href: "#capabilities",
	},
] as const;

const SECTION_SCROLL = "scroll-mt-28";

function CodeBlock(): ReactElement {
	const [activeLang, setActiveLang] = useState<LanguageId>("curl");
	const [copied, setCopied] = useState(false);
	const tabListId = useId();
	const panelId = `${tabListId}-panel`;

	const textContent = CODE_SNIPPETS[activeLang].lines.join("\n");

	const copy = async (): Promise<void> => {
		await navigator.clipboard.writeText(textContent);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="relative overflow-hidden rounded-2xl border landing-border bg-background shadow-2xl">
			<div className="flex items-center justify-between border-b landing-border bg-card px-1">
				<div
					role="tablist"
					aria-label="Lenguaje del ejemplo de código"
					className="flex flex-wrap items-center gap-1"
				>
					{LANGUAGES.map((lang) => {
						const selected = activeLang === lang.id;
						return (
							<button
								key={lang.id}
								type="button"
								role="tab"
								id={`${tabListId}-tab-${lang.id}`}
								aria-selected={selected}
								aria-controls={panelId}
								onClick={() => setActiveLang(lang.id)}
								className={cn(
									"relative min-h-11 rounded-t-lg px-4 py-2 text-xs font-medium transition-colors",
									selected
										? "-mb-px border border-b-0 landing-border bg-background text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{lang.label}
							</button>
						);
					})}
				</div>
				<button
					type="button"
					onClick={copy}
					className="mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
					aria-label={copied ? "Código copiado" : "Copiar código"}
				>
					{copied ? (
						<Check className="h-4 w-4 text-success" aria-hidden />
					) : (
						<Copy className="h-4 w-4" aria-hidden />
					)}
				</button>
			</div>

			<div
				id={panelId}
				role="tabpanel"
				aria-labelledby={`${tabListId}-tab-${activeLang}`}
				className="relative overflow-x-auto p-5"
			>
				<pre className="font-mono text-sm leading-relaxed text-foreground">
					<code>
						{CODE_SNIPPETS[activeLang].lines.map((line, index) => (
							<span key={index} className="block whitespace-pre">
								{line || "\u00a0"}
							</span>
						))}
					</code>
				</pre>
			</div>
			<p className="sr-only" aria-live="polite">
				{copied ? "Código copiado al portapapeles" : ""}
			</p>
		</div>
	);
}

export function ApiPage(): ReactElement {
	return (
		<>
			<section id="overview" className={cn("pb-16 pt-4", SECTION_SCROLL)}>
				<ScrollReveal>
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border landing-border landing-surface px-3 py-1.5">
						<span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
						<span className={`${LANDING_EYEBROW_CLASS} text-primary`}>
							API Platform
						</span>
					</div>
				</ScrollReveal>

				<ScrollReveal delay={0.05}>
					<h1 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
						Infraestructura tributaria
						<br />
						<span className="font-semibold italic text-gradient-accent">
							para desarrolladores
						</span>
					</h1>
				</ScrollReveal>

				<ScrollReveal delay={0.1}>
					<p className={`mb-8 max-w-2xl text-lg md:text-xl ${LANDING_BODY_MUTED_CLASS}`}>
						Construye sobre el sistema tributario peruano con una API moderna.
						Consulta RUCs, emite comprobantes y genera PLE/SIRE con SDKs en todos
						los lenguajes.
					</p>
				</ScrollReveal>

				<ScrollReveal delay={0.15}>
					<div className="mb-12 flex flex-wrap items-center gap-3">
						<Link
							href="#build-paths"
							className="btn-primary inline-flex min-h-11 items-center gap-2 px-6 py-3 text-sm font-semibold"
						>
							Inicio rápido
							<ArrowRight className="h-4 w-4" aria-hidden />
						</Link>
						<Link
							href="/demo"
							className="inline-flex min-h-11 items-center gap-2 rounded-xl border landing-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
						>
							Obtener API key
							<ExternalLink className="h-3.5 w-3.5" aria-hidden />
						</Link>
					</div>
				</ScrollReveal>

				<ScrollReveal delay={0.2}>
					<CodeBlock />
				</ScrollReveal>
			</section>

			<section
				id="build-paths"
				className={cn("py-16", SECTION_SCROLL, LANDING_DIVIDER_CLASS, "border-t")}
			>
				<ScrollReveal>
					<p className={LANDING_EYEBROW_CLASS}>Build paths</p>
					<h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						Empieza con los endpoints más usados
					</h2>
				</ScrollReveal>

				<div className="mt-8 grid gap-4 md:grid-cols-3">
					{BUILD_PATHS.map((path, i) => {
						const Icon = path.icon;
						return (
							<ScrollReveal key={path.title} delay={i * 0.06}>
								<Link
									href={path.href}
									className="group block rounded-2xl border landing-border landing-surface p-6 transition-colors hover:border-border-strong"
								>
									<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border landing-border bg-card/40">
										<Icon className="h-5 w-5 text-foreground" aria-hidden />
									</div>
									<h3 className="mb-2 text-sm font-semibold text-foreground">
										{path.title}
									</h3>
									<p className={`text-xs ${LANDING_BODY_MUTED_CLASS}`}>
										{path.description}
									</p>
								</Link>
							</ScrollReveal>
						);
					})}
				</div>
			</section>

			<section
				id="sdks"
				className={cn("py-16", SECTION_SCROLL, LANDING_DIVIDER_CLASS, "border-t")}
			>
				<ScrollReveal>
					<p className={LANDING_EYEBROW_CLASS}>SDKs</p>
					<h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						Listos para integrar
					</h2>
					<p className={`mt-3 max-w-xl text-sm ${LANDING_BODY_MUTED_CLASS}`}>
						SDKs oficiales para los lenguajes más usados. Instala en segundos.
					</p>
				</ScrollReveal>

				<div className="mt-8 grid gap-3 md:grid-cols-2">
					{SDK_CARDS.map((sdk) => (
						<ScrollReveal key={sdk.name}>
							<div className="flex items-center justify-between rounded-xl border landing-border landing-surface p-4">
								<div className="flex items-center gap-3">
									<div className="flex h-9 w-9 items-center justify-center rounded-lg border landing-border bg-card/40">
										<Code className="h-4 w-4 text-primary" aria-hidden />
									</div>
									<div>
										<p className="text-sm font-semibold text-foreground">
											{sdk.name}
										</p>
										<code className={`font-mono ${LANDING_CAPTION_CLASS}`}>
											{sdk.desc}
										</code>
									</div>
								</div>
								<Link
									href={sdk.repo}
									aria-label={`Abrir repositorio GitHub del SDK ${sdk.name}`}
									className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
								>
									<Github className="h-4 w-4" aria-hidden />
								</Link>
							</div>
						</ScrollReveal>
					))}
				</div>
			</section>

			<section
				id="capabilities"
				className={cn("py-16", SECTION_SCROLL, LANDING_DIVIDER_CLASS, "border-t")}
			>
				<ScrollReveal>
					<p className={LANDING_EYEBROW_CLASS}>Capacidades</p>
					<h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						Todo el sistema tributario en una API
					</h2>
				</ScrollReveal>

				<div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{CAPABILITIES.map((cap) => {
						const Icon = cap.icon;
						return (
							<ScrollReveal key={cap.id}>
								<article
									id={`capability-${cap.id}`}
									className={cn(
										"rounded-xl border landing-border landing-surface p-4",
										SECTION_SCROLL,
									)}
								>
									<Icon className="mb-3 h-4 w-4 text-primary" aria-hidden />
									<h3 className="mb-1.5 text-sm font-semibold text-foreground">
										{cap.title}
									</h3>
									<p className={`text-xs ${LANDING_BODY_MUTED_CLASS}`}>
										{cap.desc}
									</p>
								</article>
							</ScrollReveal>
						);
					})}
				</div>
			</section>

			<section
				className={cn("py-16", LANDING_DIVIDER_CLASS, "border-t")}
				aria-labelledby="api-resources-title"
			>
				<ScrollReveal>
					<p className={LANDING_EYEBROW_CLASS}>Recursos</p>
					<h2
						id="api-resources-title"
						className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl"
					>
						Soporte y referencia
					</h2>
				</ScrollReveal>

				<div className="mt-8 grid gap-3 sm:grid-cols-2">
					{RESOURCES.map((res) => {
						const Icon = res.icon;
						const inner = (
							<>
								<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border landing-border bg-card/40">
									<Icon className="h-4 w-4 text-primary" aria-hidden />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold text-foreground">
										{res.title}
									</p>
									<p className={`text-xs ${LANDING_BODY_MUTED_CLASS}`}>
										{res.desc}
									</p>
								</div>
								<ArrowUpRight
									className="h-4 w-4 shrink-0 text-section-label transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
									aria-hidden
								/>
							</>
						);

						return (
							<ScrollReveal key={res.title}>
								{"external" in res && res.external ? (
									<a
										href={res.href}
										target="_blank"
										rel="noopener noreferrer"
										className="group flex min-h-11 items-center gap-4 rounded-xl border landing-border landing-surface p-4 transition-colors hover:border-border-strong"
									>
										{inner}
									</a>
								) : (
									<Link
										href={res.href}
										className="group flex min-h-11 items-center gap-4 rounded-xl border landing-border landing-surface p-4 transition-colors hover:border-border-strong"
									>
										{inner}
									</Link>
								)}
							</ScrollReveal>
						);
					})}
				</div>
			</section>
		</>
	);
}
