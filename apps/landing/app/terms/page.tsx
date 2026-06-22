import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
	title: "Términos y Condiciones | Arkelythex",
	description:
		"Términos y condiciones de Arkelythex para sitio web, formularios, waitlist, beta, productos y futuros servicios digitales.",
	alternates: { canonical: "/terms" },
};

const lastUpdated = "31 de mayo de 2026";

export default function TermsPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-24 md:py-32">
				<header className="space-y-4 border-b border-foreground/10 pb-8">
					<p className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
						Última actualización: {lastUpdated}
					</p>
					<h1 className="text-balance text-4xl font-black tracking-[-0.05em] md:text-6xl">
						Términos y Condiciones
					</h1>
					<p className="text-base leading-7 text-muted-foreground md:text-lg">
						Estos términos regulan el acceso y uso del sitio web, formularios,
						listas de espera, programas beta, comunicaciones, productos, servicios
						digitales y futuras plataformas ofrecidas por Arkelythex.
					</p>
				</header>

				<div className="space-y-8 text-sm leading-7 text-muted-foreground md:text-base">
					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">1. Naturaleza de Arkelythex</h2>
						<p>
							Arkelythex es un proyecto tecnológico orientado al diseño, desarrollo e
							implementación de software, sistemas digitales, inteligencia artificial,
							automatización, arquitectura de software e interfaces operacionales.
							Algunas funcionalidades pueden encontrarse en fase conceptual,
							experimental, beta o de desarrollo.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">2. Uso permitido</h2>
						<p>
							El usuario se compromete a utilizar el sitio y los servicios únicamente
							para fines legales, legítimos y compatibles con estos términos. Está
							prohibido atacar, vulnerar, sobrecargar o interferir con la
							infraestructura, intentar acceder a sistemas o datos no autorizados,
							copiar o explotar contenido, código, diseño o materiales sin
							autorización, o usar Arkelythex para actividades ilícitas,
							fraudulentas, abusivas o contrarias a derechos de terceros.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">3. Acceso temprano y versiones beta</h2>
						<p>
							Arkelythex puede ofrecer acceso temprano, listas de espera, prototipos,
							demos o versiones beta. Estas versiones pueden contener errores,
							interrupciones, cambios frecuentes, limitaciones, resultados incompletos
							o funcionalidades no definitivas. El acceso a una beta no garantiza
							disponibilidad futura, precio, permanencia, continuidad comercial ni
							derecho adquirido sobre funcionalidades.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">4. Inteligencia artificial y límites</h2>
						<p>
							Arkelythex puede incorporar herramientas de inteligencia artificial,
							automatización o generación asistida de respuestas. Los resultados de
							IA pueden ser inexactos, incompletos, desactualizados o requerir
							revisión humana.
						</p>
						<p>
							Arkelythex no reemplaza asesoría profesional legal, contable,
							tributaria, financiera, técnica, médica ni de otra naturaleza
							especializada. El usuario es responsable de revisar, validar y decidir
							el uso de cualquier resultado obtenido mediante la plataforma.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">5. Propiedad intelectual</h2>
						<p>
							El nombre Arkelythex, sus logotipos, interfaces, diseño visual,
							arquitectura de producto, textos, documentación, software, código,
							conceptos, flujos, sistemas, componentes, marcas, gráficos y materiales
							pertenecen a Arkelythex o a sus respectivos titulares. El usuario no
							adquiere derechos de propiedad intelectual por acceder al sitio o usar
							los servicios.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">6. Información enviada por el usuario</h2>
						<p>
							El usuario declara que la información enviada a Arkelythex es lícita,
							verdadera y no vulnera derechos de terceros. Si envía comentarios,
							sugerencias o ideas, autoriza a Arkelythex a usarlos para mejorar sus
							productos, servicios, comunicaciones o experiencia, sin obligación de
							compensación.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">7. Servicios de terceros</h2>
						<p>
							Arkelythex puede utilizar o integrarse con servicios de terceros como
							proveedores cloud, analítica, correo electrónico, pagos, bases de datos,
							autenticación o inteligencia artificial. Arkelythex no controla ni
							garantiza la disponibilidad, seguridad o políticas de dichos terceros
							más allá de lo establecido en sus propios términos.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">8. Disponibilidad del servicio</h2>
						<p>
							Arkelythex puede modificar, suspender, limitar o discontinuar cualquier
							parte del sitio, beta, producto o servicio en cualquier momento. No se
							garantiza disponibilidad continua, ausencia total de errores o
							compatibilidad permanente con todos los dispositivos, navegadores o
							sistemas.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">9. Limitación de responsabilidad</h2>
						<p>
							En la máxima medida permitida por la ley, Arkelythex no será responsable
							por daños indirectos, pérdida de información, pérdida de oportunidad,
							lucro cesante, interrupciones, errores de terceros, decisiones tomadas
							sobre resultados generados por IA o uso indebido del servicio.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">10. Modificaciones</h2>
						<p>
							Arkelythex puede actualizar estos Términos y Condiciones. La versión
							vigente estará publicada en el sitio web.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">11. Contacto</h2>
						<p>
							Para consultas legales o relacionadas con estos términos, escribir a {" "}
							<a className="text-foreground underline" href={`mailto:${siteConfig.legalEmail}`}>
								{siteConfig.legalEmail}
							</a>
							.
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
