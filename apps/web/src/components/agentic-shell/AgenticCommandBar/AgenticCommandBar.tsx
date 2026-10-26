import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Loader2 } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { closeWorkspaceParams } from "@/lib/close-workspace";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

/**
 * AgenticCommandBar — always-visible input at the bottom of the shell.
 * Simplified for the minimal vertical slice.
 */
export function AgenticCommandBar() {
	const navigate = useNavigate();
	const { companyContext, fiscalPeriod } = useActiveCompanyContext();
	const inputRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isSubmitting) return;
		setIsSubmitting(true);

		try {
			await navigate({
				to: "/workspace/$companyId/$year/$month/$intent",
				params: closeWorkspaceParams(companyContext.companyId, fiscalPeriod),
			});
		} finally {
			setIsSubmitting(false);
			setInput("");
		}
	};

	return (
		<div className="border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
			<div className="mb-1.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
				<span className="truncate font-medium text-[var(--text-secondary)]">
					{companyContext.companyName}
				</span>
				<span aria-hidden="true">·</span>
				<span>RUC {companyContext.ruc}</span>
				{fiscalPeriod && (
					<>
						<span aria-hidden="true">·</span>
						<span>{fiscalPeriod}</span>
					</>
				)}
			</div>

			<form onSubmit={handleSubmit} className="flex items-center gap-2">
				<input
					ref={inputRef}
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Pregunta a Drenyra…"
					aria-label="Pregunta a Drenyra"
					className="h-11 flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
				/>

				<button
					type="submit"
					disabled={!input.trim() || isSubmitting}
					aria-label="Enviar"
					className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-brand-foreground transition-opacity disabled:opacity-40"
				>
					{isSubmitting ? (
						<Loader2
							size={16}
							aria-hidden="true"
							className="animate-spin motion-reduce:animate-none"
						/>
					) : (
						<ArrowUp size={16} aria-hidden="true" />
					)}
				</button>
			</form>
		</div>
	);
}
