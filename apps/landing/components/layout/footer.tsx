"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import {
	ArrowRight,
	Github,
	Linkedin,
	Mail,
	MapPin,
	Twitter,
} from "lucide-react";

import { EcosystemRail } from "@/components/landing/ecosystem-rail";
import { NewsletterFormLazy } from "@/components/newsletter-form-lazy";
import { ECOSYSTEM_NAV_LINKS } from "@/lib/landing/ecosystem-nav";
import {
	LANDING_BASE_SHELL_CLASS,
	LANDING_STICKY_ALIGNED_SHELL_CLASS,
} from "@/lib/landing/sticky-cta-layout";
import {
	LANDING_BODY_MUTED_CLASS,
	LANDING_CAPTION_CLASS,
	LANDING_DIVIDER_CLASS,
} from "@/lib/landing/ui-classes";
import { siteConfig } from "@/lib/seo/config";
import { useAnalytics } from "@/lib/use-analytics";
import { cn } from "@/lib/utils";

type FooterLink = {
	name: string;
	href: string;
	external?: boolean;
};

function buildFooterLinks(
	contactEmail: string,
): Record<string, readonly FooterLink[]> {
	return {
		Ecosistema: [
			{ name: "Inicio", href: "/" },
			...ECOSYSTEM_NAV_LINKS.map((link) => ({
				name: link.roadmap ? `${link.name} (roadmap)` : link.name,
				href: link.href,
			})),
		],
		Recursos: [
			{ name: "Demo Interactiva", href: "/demo" },
			{ name: "Planes", href: "/precios" },
			{ name: "FAQ", href: "/#faq" },
			{ name: "Contacto", href: `mailto:${contactEmail}`, external: true },
		],
		Legal: [
			{ name: "Política de Privacidad", href: "/privacy" },
			{ name: "Términos de Servicio", href: "/terms" },
			{ name: "Cookies", href: "/cookies" },
			{ name: "Legal", href: "/legal" },
			{ name: "Contacto", href: "/contact" },
			{
				name: "Reclamaciones",
				href: `mailto:${contactEmail}?subject=Libro%20de%20Reclamaciones`,
				external: true,
			},
		],
	};
}

const FOOTER_LINKS = buildFooterLinks(siteConfig.contactEmail);

function FooterSocialLinks(): ReactElement {
	return (
		<div className="flex gap-4 pt-1">
			<a
				href="https://x.com/arkelythex"
				target="_blank"
				rel="noreferrer"
				className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				aria-label="Arkelythex en X"
			>
				<Twitter className="h-5 w-5" aria-hidden />
			</a>
			<a
				href="https://linkedin.com/company/arkelythex"
				target="_blank"
				rel="noreferrer"
				className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				aria-label="Arkelythex en LinkedIn"
			>
				<Linkedin className="h-5 w-5" aria-hidden />
			</a>
			<a
				href="https://github.com/arkelythex"
				target="_blank"
				rel="noreferrer"
				className="inline-flex min-h-6 min-w-6 items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				aria-label="Arkelythex en GitHub"
			>
				<Github className="h-5 w-5" aria-hidden />
			</a>
		</div>
	);
}

function FooterNavLink({ link }: { link: FooterLink }): ReactElement {
	const className =
		"inline-flex min-h-6 items-center rounded-md text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40";

	if (link.external) {
		return (
			<a
				href={link.href}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
			>
				{link.name}
			</a>
		);
	}

	return (
		<Link href={link.href} className={className}>
			{link.name}
		</Link>
	);
}

type FooterProps = {
	/** Home (`/`): alinear con secciones cuando hay `StickyCta` lateral en desktop. */
	stickyAligned?: boolean;
	/** Home corporativa: sin banner demo/planes ni newsletter. */
	showConversionBanner?: boolean;
	/** Rail de módulos del ecosistema (off en home de marca). */
	showEcosystemRail?: boolean;
};

export function Footer({
	stickyAligned = false,
	showConversionBanner = true,
	showEcosystemRail = showConversionBanner,
}: FooterProps): ReactElement {
	const { trackCtaClick } = useAnalytics();
	const contactEmail = siteConfig.contactEmail;
	const mailtoHref = `mailto:${contactEmail}`;
	const shellClass = stickyAligned
		? LANDING_STICKY_ALIGNED_SHELL_CLASS
		: LANDING_BASE_SHELL_CLASS;

	return (
		<footer className={`bg-background pb-12 pt-20 text-foreground md:pt-24 ${LANDING_DIVIDER_CLASS}`}>
			<div className={shellClass}>
				{showEcosystemRail ? <EcosystemRail /> : null}
				{showConversionBanner ? (
				<div
					className={cn(
						"mb-14 overflow-hidden rounded-3xl border border-foreground/10 bg-gradient-to-b from-foreground/5 to-background p-6 shadow-2xl shadow-primary/10 md:mb-16 md:rounded-4xl md:p-10",
					)}
				>
					<div className="grid gap-12 lg:grid-cols-3 lg:gap-14 lg:items-start">
						<div className="flex flex-col gap-8 lg:col-span-2">
							<div className="space-y-5">
								<p className="inline-flex w-fit items-center rounded-full border border-foreground/10 bg-background/40 px-3 py-1 text-2xs font-black uppercase tracking-[0.28em] text-primary">
									Siguiente paso
								</p>
								<h2 className="text-balance text-3xl font-black leading-[1.05] tracking-[-0.04em] md:text-5xl lg:text-[2.75rem]">
									Cierra con evidencia, no con ruido.
								</h2>
								<p className={`max-w-xl text-sm md:text-base ${LANDING_BODY_MUTED_CLASS}`}>
									Pedí una demo o revisá planes. En la parte inferior tenés la
									newsletter y enlaces a producto y documentación — todo desde
									un mismo pie claro y consistente.
								</p>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
								<Link
									href="/demo"
									onClick={() =>
										trackCtaClick("solicitar_demo", "footer_banner")
									}
									className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-label font-black uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-initial sm:px-7"
								>
									Solicitar demo
									<ArrowRight className="h-4 w-4" aria-hidden />
								</Link>
								<Link
									href="/precios"
									onClick={() => trackCtaClick("ver_planes", "footer_banner")}
									className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center rounded-xl border border-foreground/15 bg-foreground/5 px-6 text-label font-black uppercase tracking-[0.18em] text-foreground transition hover:border-foreground/25 hover:bg-foreground/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex-initial sm:px-7"
								>
									Ver planes
								</Link>
							</div>
						</div>

						<aside className="flex flex-col gap-6 rounded-2xl border border-foreground/10 bg-background/50 p-6 ring-1 ring-foreground/5">
							<div className="flex items-center gap-3">
								<div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary text-sm font-black text-primary-foreground">
									A
								</div>
								<span className="text-lg font-black tracking-[-0.04em] md:text-xl">
									{siteConfig.name}
								</span>
							</div>
							<p className={`text-sm ${LANDING_BODY_MUTED_CLASS}`}>
								Infraestructura fiscal rigurosa para estudios contables que
								necesitan evidencia, control y trazabilidad.
							</p>
							<div className="space-y-4 border-t landing-border pt-5">
								<div className={`flex items-start gap-3 text-sm ${LANDING_BODY_MUTED_CLASS}`}>
									<MapPin
										className="mt-0.5 h-4 w-4 shrink-0 text-primary"
										aria-hidden
									/>
									<address className="not-italic leading-relaxed">
										Av. Javier Prado Este 4600, Surco, Lima, Perú
									</address>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<Mail className="h-4 w-4 shrink-0 text-primary" aria-hidden />
									<a
										href={mailtoHref}
										className="inline-flex min-h-6 items-center font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
									>
										{contactEmail}
									</a>
								</div>
							</div>
							<FooterSocialLinks />
						</aside>
					</div>

					<div className="mt-10 border-t border-foreground/10 pt-10 md:mt-12 md:pt-12">
						<p className={`mb-4 ${LANDING_CAPTION_CLASS} font-black uppercase tracking-[0.28em]`}>
							Newsletter
						</p>
						<NewsletterFormLazy />
					</div>
				</div>
				) : (
					<div className="mb-14 flex flex-col gap-4 border-b border-foreground/5 pb-12 md:mb-16">
						<span className="text-lg font-black tracking-[-0.04em] md:text-xl">
							{siteConfig.name}
						</span>
						<p className={`max-w-xl text-sm ${LANDING_BODY_MUTED_CLASS}`}>
							Infraestructura fiscal rigurosa para estudios contables que
							necesitan evidencia, control y trazabilidad.
						</p>
					</div>
				)}

				<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
					{Object.entries(FOOTER_LINKS).map(([category, links]) => (
						<div key={category} className="space-y-4">
							<h3 className={`${LANDING_CAPTION_CLASS} font-black uppercase tracking-[0.28em]`}>
								{category}
							</h3>
							<nav className="flex flex-col gap-3" aria-label={category}>
								{links.map((link) => (
									<FooterNavLink key={link.name} link={link} />
								))}
							</nav>
						</div>
					))}
				</div>

				<div className={`mt-14 flex flex-col gap-3 pt-8 sm:flex-row sm:items-center sm:justify-between ${LANDING_DIVIDER_CLASS} ${LANDING_CAPTION_CLASS} font-black uppercase tracking-[0.28em]`}>
					<span>© {new Date().getFullYear()} Arkelythex. Todos los derechos reservados.</span>
					<span>Perú · Compliance-first</span>
				</div>
			</div>
		</footer>
	);
}
