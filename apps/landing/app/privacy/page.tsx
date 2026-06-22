import type { Metadata } from "next";
import Link from "next/link";

import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
	title: "Política de Privacidad | Arkelythex",
	description:
		"Política de privacidad de Arkelythex para sitio web, formularios, waitlist, beta, comunicaciones y futuros servicios digitales.",
	alternates: { canonical: "/privacy" },
};

const lastUpdated = "31 de mayo de 2026";

export default function PrivacyPage() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<section className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-24 md:py-32">
				<header className="space-y-4 border-b border-foreground/10 pb-8">
					<p className="text-xs font-black uppercase tracking-[0.28em] text-muted-foreground">
						Última actualización: {lastUpdated}
					</p>
					<h1 className="text-balance text-4xl font-black tracking-[-0.05em] md:text-6xl">
						Política de Privacidad
					</h1>
					<p className="text-base leading-7 text-muted-foreground md:text-lg">
						Arkelythex respeta la privacidad de sus usuarios, visitantes,
						prospectos y clientes. Esta política explica cómo recopilamos,
						usamos, almacenamos, protegemos y tratamos datos personales.
					</p>
				</header>

				<div className="space-y-8 text-sm leading-7 text-muted-foreground md:text-base">
					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							1. Identidad del titular
						</h2>
						<p>
							El titular responsable del tratamiento de los datos personales es
							Arkelythex. Mientras se completa la constitución societaria, esta
							política opera como aviso público del proyecto Arkelythex y deberá
							actualizarse con la razón social y RUC cuando correspondan.
						</p>
						<p>
							Contacto para temas de privacidad: {" "}
							<a className="text-foreground underline" href={`mailto:${siteConfig.legalEmail}`}>
								{siteConfig.legalEmail}
							</a>
							.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							2. Datos personales que podemos recopilar
						</h2>
						<p>
							Podemos recopilar nombre y apellidos, correo electrónico, teléfono
							si el usuario lo proporciona, empresa, proyecto, cargo, actividad
							profesional, país o ciudad, mensajes enviados por formularios,
							solicitudes comerciales, beta access o listas de espera, datos
							técnicos como IP, navegador, dispositivo, fecha de acceso, páginas
							visitadas y eventos de uso, información de facturación o pago cuando
							corresponda, e información generada por futuros productos o servicios
							digitales.
						</p>
						<p>
							No solicitamos datos sensibles salvo que sea estrictamente necesario
							para una finalidad específica y con el consentimiento correspondiente.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							3. Finalidades del tratamiento
						</h2>
						<p>
							Tratamos datos personales para responder consultas, gestionar listas
							de espera, acceso temprano, pruebas beta y comunicaciones de producto,
							enviar información cuando exista consentimiento, evaluar interés
							comercial, demos, cotizaciones o contratación, mejorar el sitio y los
							productos, mantener seguridad y trazabilidad técnica, cumplir
							obligaciones legales, tributarias, contractuales o regulatorias, y
							gestionar reclamos, soporte u onboarding.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							4. Base de tratamiento
						</h2>
						<p>
							El tratamiento puede basarse en el consentimiento del usuario, la
							ejecución de una relación contractual o precontractual, el cumplimiento
							de obligaciones legales y/o el interés legítimo de Arkelythex para
							mantener la seguridad, operación y mejora de sus servicios.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							5. Proveedores y encargados de tratamiento
						</h2>
						<p>
							Arkelythex puede utilizar proveedores tecnológicos para alojamiento
							web, bases de datos, analítica, correo electrónico, formularios,
							inteligencia artificial, pagos, autenticación, infraestructura cloud y
							soporte. Estos proveedores podrán tratar datos personales únicamente
							en la medida necesaria para prestar sus servicios a Arkelythex.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							6. Transferencia internacional de datos
						</h2>
						<p>
							Algunos proveedores tecnológicos utilizados por Arkelythex pueden estar
							ubicados fuera del Perú o procesar información en infraestructura
							internacional. Al usar el sitio o enviar información, el usuario
							reconoce que sus datos pueden ser tratados mediante servicios
							tecnológicos internacionales, conforme a las medidas legales y de
							seguridad aplicables.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							7. Conservación de datos
						</h2>
						<p>
							Conservaremos los datos personales durante el tiempo necesario para
							cumplir las finalidades descritas, mientras exista una relación con el
							usuario, mientras sea necesario para obligaciones legales o hasta que
							el usuario solicite su eliminación cuando corresponda.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							8. Derechos del titular de datos
						</h2>
						<p>
							El usuario puede ejercer sus derechos de acceso, rectificación,
							cancelación, oposición, revocación del consentimiento u otros derechos
							reconocidos por la normativa aplicable escribiendo a {" "}
							<a className="text-foreground underline" href={`mailto:${siteConfig.legalEmail}`}>
								{siteConfig.legalEmail}
							</a>
							.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							9. Seguridad
						</h2>
						<p>
							Arkelythex aplica medidas razonables de seguridad técnicas,
							organizativas y administrativas para proteger datos personales contra
							acceso no autorizado, pérdida, alteración, uso indebido o divulgación
							no autorizada. Sin embargo, ningún sistema digital es absolutamente
							seguro.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							10. Uso de inteligencia artificial
						</h2>
						<p>
							Arkelythex puede utilizar herramientas de inteligencia artificial para
							mejorar productos, automatizar procesos, analizar información, asistir
							en respuestas o desarrollar funcionalidades futuras. Cuando se usen
							proveedores externos de IA, se procurará limitar la información enviada
							a lo estrictamente necesario y aplicar medidas razonables de protección.
						</p>
					</section>

					<section id="cookies" className="space-y-3 scroll-mt-24">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							11. Cookies y analítica
						</h2>
						<p>
							Podemos usar cookies esenciales para operar el sitio y cookies
							opcionales de analítica o marketing cuando el usuario brinde su
							consentimiento mediante el banner de cookies. El usuario puede elegir
							solo cookies esenciales o borrar el almacenamiento del navegador para
							reiniciar su preferencia.
						</p>
						<p>
							Ver también la {" "}
							<Link className="text-foreground underline" href="/cookies">
								Política de Cookies
							</Link>
							.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
							12. Cambios en esta política
						</h2>
						<p>
							Arkelythex puede actualizar esta Política de Privacidad. La versión
							vigente estará disponible en este sitio web.
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
