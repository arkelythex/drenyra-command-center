"use client";

import type { FormEvent, ReactElement } from "react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FISCAL_QUICK_PROMPTS = [
	{ label: "Subir factura", action: "upload" as const },
	{ label: "Preparar SIRE", prompt: "Prepará el SIRE del periodo activo con evidencia SUNAT." },
	{ label: "Cierre mensual", prompt: "Revisá el cierre mensual: CPE, libro mayor y conciliación." },
	{ label: "Validar IGV", prompt: "Validá IGV 18% y totales de mis comprobantes del periodo." },
] as const;

type DrenyraConversationalBarProps = {
	onRequestUpload?: () => void;
	className?: string;
};

/**
 * Ultra-simple conversational entry (Cursor / Gentleman-AI parity).
 * One line → chat hub or instant upload hook.
 */
export function DrenyraConversationalBar({
	onRequestUpload,
	className,
}: DrenyraConversationalBarProps): ReactElement {
	const navigate = useNavigate();
	const [prompt, setPrompt] = useState("");

	const goToDrenyra = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		void navigate({
			to: "/drenyra",
			search: { fiscalCaseLabel: trimmed.slice(0, 80) },
		});
	};

	const onSubmit = (event: FormEvent) => {
		event.preventDefault();
		goToDrenyra(prompt);
	};

	return (
		<div
			className={cn(
				"rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 p-3",
				className,
			)}
		>
			<form onSubmit={onSubmit} className="flex gap-2">
				<div className="relative min-w-0 flex-1">
					<MessageSquare
						size={16}
						className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
						aria-hidden
					/>
					<input
						type="text"
						value={prompt}
						onChange={(event) => setPrompt(event.target.value)}
						placeholder="Decime qué necesitás: subí facturas, SIRE, cierre…"
						className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] pl-9 pr-3 text-sm outline-none ring-[var(--color-info)]/40 placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-info)]/50 focus:ring-2"
						aria-label="Comando fiscal conversacional"
					/>
				</div>
				<Button type="submit" size="sm" disabled={!prompt.trim()}>
					<SendHorizontal size={14} />
					Ir
				</Button>
			</form>
			<div className="mt-2 flex flex-wrap gap-1.5">
				{FISCAL_QUICK_PROMPTS.map((item) => (
					<button
						key={item.label}
						type="button"
						className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-2xs text-[var(--text-secondary)] transition hover:border-[var(--color-info)]/40 hover:text-[var(--color-info)]"
						onClick={() => {
							if ("action" in item && item.action === "upload") {
								onRequestUpload?.();
								return;
							}
							if ("prompt" in item) {
								goToDrenyra(item.prompt);
							}
						}}
					>
						{item.label}
					</button>
				))}
			</div>
		</div>
	);
}
