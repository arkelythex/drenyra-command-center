"use client";

import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

import { ConsentCheckbox } from "@/components/ui/consent-checkbox";

type FormState = "idle" | "loading" | "success" | "error";

type DemoFormData = {
	company: string;
	email: string;
	message: string;
	name: string;
	phone: string;
	planInterest: string;
	privacyConsent: boolean;
};

const INITIAL_FORM_DATA: DemoFormData = {
	company: "",
	email: "",
	message: "",
	name: "",
	phone: "",
	planInterest: "unsure",
	privacyConsent: false,
};

const INPUT_CLASS =
	"min-h-12 rounded-xl border border-foreground/10 bg-foreground/[0.03] px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:bg-foreground/[0.05]";

export function DemoRequestForm(): ReactElement {
	const [formData, setFormData] = useState<DemoFormData>(INITIAL_FORM_DATA);
	const [formState, setFormState] = useState<FormState>("idle");

	function updateField(
		field: keyof Omit<DemoFormData, "privacyConsent">,
	): (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void {
		return (event) => {
			setFormData((current) => ({ ...current, [field]: event.target.value }));
		};
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setFormState("loading");

		try {
			const response = await fetch("/api/demo", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) throw new Error("Failed to submit demo request");

			setFormState("success");
			setFormData(INITIAL_FORM_DATA);
		} catch {
			setFormState("error");
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto mt-12 grid max-w-2xl gap-4 rounded-3xl border border-foreground/10 bg-foreground/[0.025] p-5 text-left shadow-2xl shadow-primary/5 sm:p-6"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-2">
					<label htmlFor="demo-name" className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
						Nombre
					</label>
					<input id="demo-name" required value={formData.name} onChange={updateField("name")} className={INPUT_CLASS} placeholder="Tu nombre" />
				</div>
				<div className="grid gap-2">
					<label htmlFor="demo-email" className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
						Email
					</label>
					<input id="demo-email" type="email" required value={formData.email} onChange={updateField("email")} className={INPUT_CLASS} placeholder="tu@empresa.com" />
				</div>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className="grid gap-2">
					<label htmlFor="demo-company" className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
						Empresa o proyecto
					</label>
					<input id="demo-company" required value={formData.company} onChange={updateField("company")} className={INPUT_CLASS} placeholder="Nombre comercial" />
				</div>
				<div className="grid gap-2">
					<label htmlFor="demo-phone" className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
						WhatsApp
					</label>
					<input id="demo-phone" value={formData.phone} onChange={updateField("phone")} className={INPUT_CLASS} placeholder="+51 999 999 999" />
				</div>
			</div>

			<div className="grid gap-2">
				<label htmlFor="demo-plan" className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
					Plan de interés
				</label>
				<select id="demo-plan" value={formData.planInterest} onChange={updateField("planInterest")} className={INPUT_CLASS}>
					<option value="unsure">Por definir</option>
					<option value="esencial">Esencial — S/149/mes</option>
					<option value="pro">Pro — S/249/mes</option>
					<option value="scale">Scale — S/1,199/mes</option>
				</select>
			</div>

			<div className="grid gap-2">
				<label htmlFor="demo-message" className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
					¿Qué necesitás validar?
				</label>
				<textarea id="demo-message" required value={formData.message} onChange={updateField("message")} className={`${INPUT_CLASS} min-h-32 resize-y`} placeholder="Contanos tu operación, volumen, RUCs, flujo SUNAT o problema principal." />
			</div>

			<ConsentCheckbox
				id="demo-privacy-consent"
				checked={formData.privacyConsent}
				onCheckedChange={(privacyConsent) => setFormData((current) => ({ ...current, privacyConsent }))}
				label={
					<>
						Acepto que Arkelythex trate mis datos para responder mi solicitud de demo y contactarme sobre el producto conforme a la {" "}
						<a href="/privacy" className="text-foreground underline underline-offset-4">
							Política de Privacidad
						</a>
						.
					</>
				}
			/>

			<button
				type="submit"
				disabled={formState === "loading"}
				className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
			>
				{formState === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
				{formState === "success" ? <CheckCircle className="h-4 w-4" aria-hidden /> : null}
				{formState === "loading" ? "Enviando" : formState === "success" ? "Solicitud enviada" : "Solicitar piloto"}
				{formState === "idle" || formState === "error" ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
			</button>

			{formState === "success" ? <p className="text-sm text-foreground/80">Recibimos tu solicitud. Te responderemos por email o WhatsApp.</p> : null}
			{formState === "error" ? <p className="text-sm text-red-300">No pudimos enviar la solicitud. Probá por WhatsApp o intentá nuevamente.</p> : null}
		</form>
	);
}
