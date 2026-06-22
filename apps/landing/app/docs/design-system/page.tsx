"use client";

import type { ElementType, JSX } from "react";
import Link from "next/link";
import {
	AlertCircle,
	BadgeCheck,
	Grid3x3,
	LayoutGrid,
	Layers3,
	Leaf,
	Palette,
	Sparkles,
} from "lucide-react";

import { Badge } from "@arkelythex/ui";
import { Card } from "@arkelythex/ui";
import { FeatureCard } from "@/components/ui/feature-card";
import { PageHeader } from "@/components/ui/page-header";
import {
	designSystemTokenSections,
	type ColorToken,
	type FontToken,
	type RadiusToken,
	type SpacingToken,
	type TokenBase,
	type TokenCategory,
} from "@/lib/design-system-token-contract";
const SECTION_ICONS: Record<TokenCategory, ElementType> = {
	neutrals: Palette,
	brand: Leaf,
	"semantic-states": AlertCircle,
	"semantic-colors": Layers3,
	radius: Grid3x3,
	fonts: BadgeCheck,
	spacing: LayoutGrid,
};

function isColorToken(t: TokenBase): t is ColorToken {
	return "swatch" in t && typeof (t as ColorToken).swatch === "string";
}

function isRadiusToken(t: TokenBase): t is RadiusToken {
	return "preview" in t && (t as RadiusToken).preview?.kind === "radius";
}

function isFontToken(t: TokenBase): t is FontToken {
	return "preview" in t && (t as FontToken).preview?.kind === "font";
}

function isSpacingToken(t: TokenBase): t is SpacingToken {
	return "preview" in t && (t as SpacingToken).preview?.kind === "spacing";
}

function renderSectionHeading(
	title: string,
	description: string,
	count: number,
	category: TokenCategory,
): JSX.Element {
	const Icon = SECTION_ICONS[category];

	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
			<div className="space-y-3">
				<Badge className="border-accent/30 bg-accent/10 text-accent">
					<Icon className="h-3.5 w-3.5" aria-hidden />
					{title}
				</Badge>
				<div className="space-y-2">
					<h2 className="scroll-mt-28 text-2xl font-black tracking-tight text-gradient-accent md:text-3xl">
						{title}
					</h2>
					<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">
						{description}
					</p>
				</div>
			</div>

			<Badge className="border-primary/30 bg-primary/10 text-primary">
				{count} tokens
			</Badge>
		</div>
	);
}

function TokenSectionBody({
	category,
	tokens,
}: {
	category: TokenCategory;
	tokens: readonly TokenBase[];
}) {
	const first = tokens[0];
	if (first && isColorToken(first)) {
		return (
			<div className="grid gap-4 lg:grid-cols-2">
				{(tokens as readonly ColorToken[]).map((token) => (
					<Card
						key={token.name}
						className="rounded-2xl border border-border/20 bg-secondary/5 space-y-4 p-5"
						data-token-category={category}
						data-token-name={token.name}
					>
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-2">
								<Badge className="border-primary/30 bg-primary/10 text-primary">
									{token.name}
								</Badge>
								<code className="block rounded-[var(--radius-md)] border border-border bg-[rgba(14,10,8,0.30)] px-3 py-2 font-mono text-xs text-muted-foreground/75">
									{token.value}
								</code>
							</div>
							<div
								className="h-14 w-14 shrink-0 rounded-[var(--radius-md)] border border-border shadow-inner shadow-[rgba(14,10,8,0.30)]"
								style={{ background: token.swatch }}
								aria-label={`${token.name} swatch`}
							/>
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground/75">
							{token.usage}
						</p>
					</Card>
				))}
			</div>
		);
	}

	if (first && isRadiusToken(first)) {
		return (
			<div className="grid gap-4 xl:grid-cols-2">
				{(tokens as readonly RadiusToken[]).map((token) => (
					<Card
						key={token.name}
						className="space-y-4 border-border p-5"
						data-token-category={category}
						data-token-name={token.name}
					>
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-2">
								<Badge className="border-border/50 bg-muted/50 text-muted-foreground">
									{token.name}
								</Badge>
								<code className="block rounded-[var(--radius-md)] border border-border bg-[rgba(14,10,8,0.30)] px-3 py-2 font-mono text-xs text-muted-foreground/75">
									{token.value}
								</code>
							</div>
							<div className="space-y-2 text-right">
								<div
									className="h-14 w-20 border border-border bg-surface/50"
									style={{ borderRadius: token.value }}
									aria-hidden
								/>
								<p className="text-2xs font-black uppercase tracking-[0.3em] text-muted-foreground/45">
									{token.preview.label}
								</p>
							</div>
						</div>
						<p className="text-sm leading-relaxed text-muted-foreground/75">
							{token.usage}
						</p>
					</Card>
				))}
			</div>
		);
	}

	if (first && isFontToken(first)) {
		return (
			<div className="grid gap-4 lg:grid-cols-2">
				{(tokens as readonly FontToken[]).map((token) => (
					<Card
						key={token.name}
						className="rounded-2xl border border-border/20 bg-secondary/5 space-y-4 p-5"
						data-token-name={token.name}
					>
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-2">
								<Badge className="border-border/50 bg-muted/50 text-muted-foreground">
									{token.name}
								</Badge>
								<code className="block rounded-[var(--radius-md)] border border-border bg-[rgba(14,10,8,0.30)] px-3 py-2 font-mono text-xs text-muted-foreground/75">
									{token.value}
								</code>
							</div>
							<Badge className="border-border bg-transparent text-foreground">
								{token.preview.kind}
							</Badge>
						</div>
						<div className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-[rgba(14,10,8,0.30)] p-4">
							<p
								className={`text-3xl font-black tracking-tight text-foreground ${token.preview.className}`}
							>
								{token.preview.sample}
							</p>
							<p className="text-sm leading-relaxed text-muted-foreground/75">
								{token.usage}
							</p>
						</div>
					</Card>
				))}
			</div>
		);
	}

	if (first && isSpacingToken(first)) {
		return (
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{(tokens as readonly SpacingToken[]).map((token) => (
					<Card
						key={token.name}
						className="flex items-center gap-4 border-border p-4"
						data-token-name={token.name}
					>
						<div
							className="shrink-0 rounded-sm bg-primary/20"
							style={{
								width: token.preview.pixels + "px",
								height: token.preview.pixels + "px",
							}}
							aria-hidden
						/>
						<div>
							<p className="font-mono text-xs text-foreground">{token.name}</p>
							<p className="text-sm text-muted-foreground">{token.usage}</p>
						</div>
					</Card>
				))}
			</div>
		);
	}

	return null;
}

function DesignSystemPage(): JSX.Element {
	return (
		<div className="space-y-16 pb-12">
			<section
				id="overview"
				data-toc-title="Vista general"
				className="scroll-mt-28 space-y-8"
			>
				<PageHeader
					badge={{ icon: Sparkles, text: "Design System" }}
					title="Arkelythex DS —"
					highlight="landing / docs"
					description="Dark enterprise: neutros grafito, marca cobre/ámbar institucional, semántica de riesgo fiscal, escala 4px y tipografía Inter + mono."
				/>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{designSystemTokenSections.map((section) => {
						const Icon = SECTION_ICONS[section.category];
						return (
							<FeatureCard
								key={section.category}
								title={section.title}
								description={section.description}
								icon={Icon}
								footer={
									<Badge className="border-accent/30 bg-accent/10 text-accent">
										{section.tokens.length} tokens
									</Badge>
								}
							/>
						);
					})}
				</div>
			</section>

			<section id="filosofia" className="scroll-mt-28 space-y-3">
				<h2 className="text-2xl font-black tracking-tight text-gradient-accent md:text-3xl">
					Filosofía
				</h2>
				<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">
					Superficies oscuras neutras, acentos fríos y semántica de riesgo
					legible: la UI debe reducir carga cognitiva en flujos fiscales y
					contables, no competir por atención con el dato crítico.
				</p>
			</section>

			<section id="principios" className="scroll-mt-28 space-y-3">
				<h2 className="text-2xl font-black tracking-tight text-gradient-accent md:text-3xl">
					Principios de interfaz
				</h2>
				<ul className="max-w-2xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground/75">
					<li>
						Jerarquía clara: primero estado y severidad, después decoración.
					</li>
					<li>
						Tokens antes que valores sueltos: mismo contrato en landing, docs y
						producto.
					</li>
					<li>
						Accesibilidad: contraste AA, foco visible, motion reducible con
						prefers-reduced-motion.
					</li>
				</ul>
				<p className="text-sm text-muted-foreground/75">
					Voz y tono de marca:{" "}
					<Link
						href="/docs/visuals#voz-marca"
						className="font-medium text-accent underline-offset-4 hover:underline"
					>
						guía en Media Kit
					</Link>
					.
				</p>
			</section>

			{designSystemTokenSections.map((section) => (
				<section
					key={section.category}
					id={section.category}
					className="scroll-mt-28 space-y-6"
				>
					{renderSectionHeading(
						section.title,
						section.description,
						section.tokens.length,
						section.category,
					)}
					<TokenSectionBody
						category={section.category}
						tokens={section.tokens}
					/>
				</section>
			))}

			<section id="efectos-motion" className="scroll-mt-28 space-y-3">
				<h2 className="text-2xl font-black tracking-tight text-gradient-accent md:text-3xl">
					Elevación y motion
				</h2>
				<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">
					Sombras, anillos de foco y transiciones siguen utilidades Tailwind y
					variables del tema (p. ej.{" "}
					<code className="rounded border border-border bg-[rgba(14,10,8,0.30)] px-1.5 py-0.5 font-mono text-xs">
						shadow-*
					</code>
					,{" "}
					<code className="rounded border border-border bg-[rgba(14,10,8,0.30)] px-1.5 py-0.5 font-mono text-xs">
						ring-*
					</code>
					). No hay tokens dedicados en esta referencia; mantener consistencia
					con{" "}
					<Link
						href="/docs/visuals#colores"
						className="font-medium text-accent underline-offset-4 hover:underline"
					>
						paleta de marca
					</Link>{" "}
					y variables en{" "}
					<code className="font-mono text-xs">app/globals.css</code> del
					proyecto — evitar sombras cálidas que choquen con el baseline frío.
				</p>
			</section>

			<section id="componentes" className="scroll-mt-28 space-y-3">
				<h2 className="text-2xl font-black tracking-tight text-gradient-accent md:text-3xl">
					Componentes
				</h2>
				<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">
					Primitivas compartidas viven en{" "}
					<code className="rounded border border-border bg-[rgba(14,10,8,0.30)] px-1.5 py-0.5 font-mono text-xs">
						components/ui
					</code>{" "}
					(Radix + Tailwind v4). Componer desde tokens y variantes documentadas
					aquí; nuevos patrones deben reutilizar el contrato de color y espacio.
				</p>
			</section>

			<section id="patrones" className="scroll-mt-28 space-y-3">
				<h2 className="text-2xl font-black tracking-tight text-gradient-accent md:text-3xl">
					Patrones
				</h2>
				<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/75">
					Layout en rejilla responsive, cards con variante glass/outlined según
					profundidad, headers con{" "}
					<code className="rounded border border-border bg-[rgba(14,10,8,0.30)] px-1.5 py-0.5 font-mono text-xs">
						PageHeader
					</code>{" "}
					y CTAs con una sola jerarquía primaria por vista. Para activos y voz,
					alinear con el{" "}
					<Link
						href="/docs/visuals"
						className="font-medium text-accent underline-offset-4 hover:underline"
					>
						Media Kit
					</Link>
					.
				</p>
			</section>
		</div>
	);
}

export default DesignSystemPage;
