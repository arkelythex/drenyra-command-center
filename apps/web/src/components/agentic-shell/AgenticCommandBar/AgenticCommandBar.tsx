import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, Loader2 } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
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
				params: {
					companyId: companyContext.companyId,
					year: "2026",
					month: "3",
					intent: "close",
				},
			});
		} finally {
			setIsSubmitting(false);
			setInput("");
		}
	};

	return (
		<div className="border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
			<div className="mb-1.5 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
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
					placeholder="Ask Drenyra…"
					className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
				/>

				<button
					type="submit"
					disabled={!input.trim() || isSubmitting}
					className="flex items-center justify-center rounded-md bg-[var(--color-primary)] p-1.5 text-white transition-opacity disabled:opacity-40"
				>
					{isSubmitting ? (
						<Loader2 size={14} className="animate-spin" />
					) : (
						<ArrowUp size={14} />
					)}
				</button>
			</form>
		</div>
	);
}
