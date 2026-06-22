"use client";

import type { ReactElement } from "react";
import { useCallback, useState } from "react";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConsentCheckbox } from "@/components/ui/consent-checkbox";
import { useAnalytics } from "@/lib/use-analytics";

type FormState = "idle" | "loading" | "success" | "error";

function NewsletterForm({
	className = "",
	source = "footer",
}: {
	className?: string;
	source?: string;
}): ReactElement {
	const [email, setEmail] = useState("");
	const [newsletterConsent, setNewsletterConsent] = useState(false);
	const [formState, setFormState] = useState<FormState>("idle");
	const { trackNewsletterSignup } = useAnalytics();

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setFormState("loading");

			try {
				const response = await fetch("/api/newsletter", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, newsletterConsent, source }),
				});

				if (!response.ok) throw new Error("Failed to subscribe");

				trackNewsletterSignup(email, source);
				setFormState("success");

				setTimeout(() => {
					setFormState("idle");
					setEmail("");
					setNewsletterConsent(false);
				}, 4000);
			} catch {
				trackNewsletterSignup(email, `${source}_failed`);
				setFormState("error");
			}
		},
		[email, newsletterConsent, source, trackNewsletterSignup],
	);

	return (
		<div className={`w-full max-w-lg mx-auto ${className}`}>
			<form onSubmit={handleSubmit} className="relative group">
				<label htmlFor="newsletter-email" className="sr-only">
					Correo electrónico
				</label>
				<div className="relative flex flex-col gap-2 p-1.5 sm:flex-row sm:items-stretch sm:gap-0 rounded-2xl bg-foreground/[0.03] border border-foreground/10 group-focus-within:border-accent/40 group-focus-within:bg-foreground/5 transition-all duration-500 min-w-0">
					<input
						id="newsletter-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="tu@empresa.com"
						required
						className="min-h-12 w-full min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-foreground placeholder:text-foreground/45 focus:outline-none sm:px-6 sm:py-3 sm:text-lg sm:font-medium"
					/>

					<button
						type="submit"
						disabled={formState !== "idle"}
						className={`min-h-12 w-full shrink-0 justify-center px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-500 sm:min-h-0 sm:w-auto ${
							formState === "success"
								? "bg-primary text-primary-foreground"
								: "btn-primary"
						}`}
					>
						<AnimatePresence mode="wait">
							{formState === "loading" ? (
								<motion.div
									key="loading"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
								>
									<Loader2 className="w-5 h-5 animate-spin" aria-hidden />
								</motion.div>
							) : formState === "success" ? (
								<motion.div
									key="success"
									initial={{ scale: 0.5, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									className="flex items-center gap-2"
								>
									<CheckCircle className="w-5 h-5" aria-hidden />
									<span>¡Enviado!</span>
								</motion.div>
							) : (
								<motion.div
									key="idle"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="flex items-center gap-2"
								>
									<span>Mantenme al tanto</span>
									<ArrowRight className="w-4 h-4" aria-hidden />
								</motion.div>
							)}
						</AnimatePresence>
					</button>
				</div>
				<ConsentCheckbox
					id="newsletter-consent"
					checked={newsletterConsent}
					onCheckedChange={setNewsletterConsent}
					label={
						<>
							Acepto recibir comunicaciones, novedades, invitaciones y
							contenido de Arkelythex. Puedo retirar mi consentimiento en
							cualquier momento, conforme a la {" "}
							<a
								href="/privacy"
								className="text-foreground underline underline-offset-4"
							>
								Política de Privacidad
							</a>
							.
						</>
					}
				/>
				<div className="absolute -inset-1 bg-accent/20 rounded-[20px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-1000 pointer-events-none" />
			</form>

			<p className="mt-6 text-2xs font-bold uppercase tracking-[0.2em] text-foreground/20 text-center">
				No hacemos spam. Solo actualizaciones críticas del ecosistema.
			</p>
		</div>
	);
}

export function NewsletterFormLazy() {
	return <NewsletterForm />;
}
