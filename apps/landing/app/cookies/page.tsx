import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Política de Cookies | Arkelythex",
	description:
		"Política de cookies de Arkelythex para cookies esenciales, analítica, marketing y preferencias de consentimiento.",
	alternates: { canonical: "/cookies" },
};

const lastUpdated = "31 de mayo de 2026";

export default function CookiesPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-24 md:py-32" aria-label="Política de Cookies">
				<header className="space-y-4 border-b border-foreground/10 pb-8">
					<p className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
						Última actualización: {lastUpdated}
					</p>
					<h1 className="text-balance text-4xl font-black tracking-[-0.05em] md:text-6xl">
						Política de Cookies
					</h1>
					<p className="text-base leading-7 text-muted-foreground md:text-lg">
						Esta página explica cómo Arkelythex usa cookies y tecnologías similares
						para operar el sitio, recordar preferencias y medir el uso del producto.
					</p>
				</header>

				<div className="space-y-8 text-sm leading-7 text-muted-foreground md:text-base">
					<section className="space-y-3" aria-label="Cookies esenciales">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">1. Cookies esenciales</h2>
						<p>
							Son necesarias para operar el sitio, recordar preferencias básicas y
							mantener funciones de seguridad. Pueden estar activas sin consentimiento
							adicional cuando sean estrictamente necesarias.
						</p>
					</section>

					<section className="space-y-3" aria-label="Cookies de analítica">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">2. Cookies de analítica</h2>
						<p>
							Ayudan a entender cómo se usa el sitio, qué páginas se visitan y dónde
							puede mejorar la experiencia. Arkelythex debe activarlas solo cuando el
							usuario las acepte desde el banner de cookies o configuración equivalente.
						</p>
					</section>

					<section className="space-y-3" aria-label="Cookies de marketing">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">3. Cookies de marketing</h2>
						<p>
							Pueden utilizarse para medir campañas o mostrar comunicaciones más
							relevantes. No deben activarse si el usuario elige solo cookies
							esenciales.
						</p>
					</section>

					<section className="space-y-3" aria-label="Cambio de preferencia">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">4. Cambio de preferencia</h2>
						<p>
							El usuario puede borrar el almacenamiento del navegador para reiniciar
							su preferencia de cookies. Arkelythex deberá agregar un panel de
							preferencias cuando el uso de cookies no esenciales crezca.
						</p>
					</section>
				</div>

				<Link href="/" className="text-sm font-bold uppercase tracking-[0.18em] text-foreground underline">
					Volver a Arkelythex
				</Link>
			</section>
		</main>
	);
}
