import { ArrowUp, Loader2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useAskDrenyra } from "@/features/ask-drenyra/useAskDrenyra";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

/**
 * AgenticCommandBar — always-visible "Pregunta a Drenyra" composer at the
 * bottom of the shell. Questions go to the session-authorized cognitive
 * stream; the answer streams into a panel above the input.
 */
export function AgenticCommandBar() {
	const { companyContext, fiscalPeriod } = useActiveCompanyContext();
	const [input, setInput] = useState("");
	const ask = useAskDrenyra(companyContext.companyId);
	const isStreaming = ask.status === "streaming";

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const question = input.trim();
		if (!question || isStreaming) return;
		setInput("");
		void ask.ask(question);
	};

	return (
		<div className="border-t border-[var(--border-subtle)] bg-card px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
			{ask.status !== "idle" && (
				<section
					aria-label="Respuesta de Drenyra"
					className="mb-2 max-h-[40vh] overflow-y-auto rounded-xl border border-border bg-card p-4 text-sm"
				>
					<div className="flex items-start justify-between gap-3">
						<p className="font-medium text-foreground">{ask.question}</p>
						<button
							type="button"
							onClick={ask.reset}
							aria-label="Cerrar respuesta"
							className="-m-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
						>
							<X aria-hidden="true" className="size-4" />
						</button>
					</div>
					<div
						aria-live="polite"
						aria-busy={isStreaming}
						className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground"
					>
						{ask.answer}
						{isStreaming && !ask.answer && (
							<span className="text-muted-foreground">
								Drenyra está respondiendo…
							</span>
						)}
					</div>
					{ask.error && (
						<p role="alert" className="mt-2 text-destructive">
							{ask.error}
						</p>
					)}
					{ask.status === "done" && (
						<p className="mt-3 text-xs text-muted-foreground">
							Respuesta generada por IA. Verifícala antes de usarla en una
							declaración.
						</p>
					)}
				</section>
			)}

			<div className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
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
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Pregunta a Drenyra…"
					aria-label="Pregunta a Drenyra"
					className="h-11 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
				/>
				<button
					type="submit"
					disabled={!input.trim() || isStreaming}
					aria-label="Enviar"
					className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground transition-opacity disabled:opacity-40"
				>
					{isStreaming ? (
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
