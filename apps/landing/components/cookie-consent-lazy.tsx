"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Cookie, Shield, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics } from "@/lib/use-analytics";

declare global {
	interface Window {
		gtag?: (
			command: string,
			event: string,
			params?: Record<string, unknown>,
		) => void;
	}
}

function CookieConsent() {
	const [isVisible, setIsVisible] = useState(false);
	const [showDetails, setShowDetails] = useState(false);
	const { trackCtaClick } = useAnalytics();

	const handleAcceptAll = useCallback(() => {
		localStorage.setItem("arkelythex-cookie-consent", "all");
		localStorage.setItem(
			"arkelythex-cookie-consent-timestamp",
			Date.now().toString(),
		);
		setIsVisible(false);
		trackCtaClick("cookie_consent_accept_all", "cookie_banner");
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("consent", "update", {
				analytics_storage: "granted",
				ad_storage: "granted",
			});
		}
	}, [trackCtaClick]);

	const handleAcceptEssential = useCallback(() => {
		localStorage.setItem("arkelythex-cookie-consent", "essential");
		localStorage.setItem(
			"arkelythex-cookie-consent-timestamp",
			Date.now().toString(),
		);
		setIsVisible(false);
		trackCtaClick("cookie_consent_essential_only", "cookie_banner");
		if (typeof window !== "undefined" && window.gtag) {
			window.gtag("consent", "update", {
				analytics_storage: "denied",
				ad_storage: "denied",
			});
		}
	}, [trackCtaClick]);

	const handleClose = useCallback(() => {
		localStorage.setItem("arkelythex-cookie-consent", "dismissed");
		localStorage.setItem(
			"arkelythex-cookie-consent-timestamp",
			Date.now().toString(),
		);
		setIsVisible(false);
		trackCtaClick("cookie_consent_dismiss", "cookie_banner");
	}, [trackCtaClick]);

	useEffect(() => {
		const storedConsent = localStorage.getItem("arkelythex-cookie-consent");
		if (!storedConsent) {
			const timer = setTimeout(() => setIsVisible(true), 2000);
			return () => clearTimeout(timer);
		}
	}, []);

	if (!isVisible) return null;

	return (
		<AnimatePresence>
			{isVisible && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="fixed inset-0 z-[49] bg-background/60 backdrop-blur-xl"
						onClick={handleClose}
					/>
					<motion.div
						initial={{ opacity: 0, y: 100 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 100 }}
						transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
						className="fixed bottom-0 left-0 right-0 z-50"
					>
						<div className="container mx-auto max-w-4xl px-4 pb-4">
							<div className="rounded-2xl border border-border/20 bg-secondary/5 p-6 relative overflow-hidden shadow-2xl shadow-[rgba(14,10,8,0.50)]">
								<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent-secondary opacity-50" />

								<div className="flex flex-col gap-4">
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
												<Cookie className="w-5 h-5 text-accent" />
											</div>
											<div>
												<h2 className="text-base font-semibold text-foreground">
													Configuración de Cookies
												</h2>
												<p className="text-sm text-muted-foreground">
													Tu privacidad es importante para nosotros
												</p>
											</div>
										</div>
										<button
											type="button"
											onClick={handleClose}
											className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10"
											aria-label="Cerrar"
										>
											<X className="h-5 w-5" aria-hidden />
										</button>
									</div>

									<div className="space-y-4">
										<p className="text-sm text-muted-foreground leading-relaxed">
											Utilizamos cookies para mejorar tu experiencia, analizar
											el tráfico y personalizar contenido. Al continuar
											navegando, aceptas nuestra{" "}
											<a
												href="/privacy"
												className="inline-flex min-h-6 items-center text-accent hover:underline"
											>
												Política de Privacidad
											</a>{" "}
											y{" "}
											<a
												href="/cookies"
												className="inline-flex min-h-6 items-center text-accent hover:underline"
											>
												Política de Cookies
											</a>
											.
										</p>

										<AnimatePresence>
											{showDetails && (
												<motion.div
													initial={{ opacity: 0, height: 0 }}
													animate={{ opacity: 1, height: "auto" }}
													exit={{ opacity: 0, height: 0 }}
													className="overflow-hidden"
												>
													<div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-foreground/10">
														<div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
															<div className="flex items-center gap-2 mb-2">
																<Shield className="w-4 h-4 text-primary" />
																<span className="font-medium text-sm">
																	Esenciales
																</span>
																<span className="text-2xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
																	Siempre activas
																</span>
															</div>
															<p className="text-xs text-muted-foreground">
																Necesarias para el funcionamiento del sitio.
															</p>
														</div>
														<div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
															<div className="flex items-center gap-2 mb-2">
																<Info className="w-4 h-4 text-accent" />
																<span className="font-medium text-sm">
																	Analíticas
																</span>
															</div>
															<p className="text-xs text-muted-foreground">
																Nos ayudan a entender cómo usas el sitio.
															</p>
														</div>
														<div className="p-4 rounded-xl bg-foreground/5 border border-foreground/10">
															<div className="flex items-center gap-2 mb-2">
																<Info className="w-4 h-4 text-accent-secondary" />
																<span className="font-medium text-sm">
																	Marketing
																</span>
															</div>
															<p className="text-xs text-muted-foreground">
																Utilizadas para mostrarte anuncios relevantes.
															</p>
														</div>
													</div>
												</motion.div>
											)}
										</AnimatePresence>

										<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
											<button
												onClick={() => setShowDetails(!showDetails)}
												className="inline-flex min-h-6 items-center text-sm text-accent hover:underline"
											>
												{showDetails ? "Ocultar detalles" : "Ver detalles"}
											</button>
											<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
												<button
													onClick={handleAcceptEssential}
													className="min-h-6 px-5 py-2.5 text-sm font-semibold rounded-xl border border-foreground/10 bg-foreground/5 text-foreground/80 hover:bg-foreground/10 transition-colors"
												>
													Solo esenciales
												</button>
												<button
													onClick={handleAcceptAll}
													className="btn-primary min-h-6 px-5 py-2.5 text-sm"
												>
													Aceptar todas
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}

export function CookieConsentLazy() {
	return <CookieConsent />;
}
