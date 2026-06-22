import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Legal | Arkelythex",
	description:
		"Centro legal de Arkelythex: privacidad, términos, cookies, contacto y preparación de cumplimiento digital.",
	alternates: { canonical: "/legal" },
};

const legalLinks = [
	{
		description: "Cómo Arkelythex trata datos personales, proveedores, IA, conservación, derechos ARCO y transferencias internacionales.",
		href: "/privacy",
		label: "Política de Privacidad",
	},
	{
		description: "Reglas de uso del sitio, beta, IA, propiedad intelectual, servicios de terceros y límites de responsabilidad.",
		href: "/terms",
		label: "Términos y Condiciones",
	},
	{
		description: "Uso de cookies esenciales, analítica, marketing y preferencias de consentimiento.",
		href: "/cookies",
		label: "Política de Cookies",
	},
	{
		description: "Canal de contacto legal, privacidad, producto, beta y solicitudes de datos.",
		href: "/contact",
		label: "Contacto",
	},
] as const;

export default function LegalPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-24 md:py-32">
				<header className="space-y-4 border-b border-foreground/10 pb-8">
					<p className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
						Cumplimiento digital mínimo viable
					</p>
					<h1 className="text-balance text-4xl font-black tracking-[-0.05em] md:text-6xl">
						Legal Arkelythex
					</h1>
					<p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
						Centro público para políticas legales, privacidad, cookies, contacto y
						cumplimiento digital de Arkelythex.
					</p>
				</header>

				<div className="grid gap-4 md:grid-cols-2">
					{legalLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-6 transition hover:border-foreground/25 hover:bg-foreground/[0.06]"
						>
							<h2 className="text-lg font-black tracking-[-0.03em]">{link.label}</h2>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								{link.description}
							</p>
						</Link>
					))}
				</div>
			</section>
		</main>
	);
}
