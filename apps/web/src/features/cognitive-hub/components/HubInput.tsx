import { BrainCircuit, Command, SendHorizontal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HubIntent } from "../logic/intent-parser";

interface HubInputProps {
	value: string;
	intent: HubIntent;
	onChange: (value: string) => void;
	onSubmit: () => void;
}

export function HubInput({ value, intent, onChange, onSubmit }: HubInputProps) {
	const placeholder =
		intent === "command"
			? "Escribe una acción rápida (/)..."
			: intent === "task"
				? "Describe la tarea o el proceso contable a revisar..."
				: "Pregunta o pide un análisis sobre tu contexto actual...";

	return (
		<div className="border-b border-[var(--border-subtle)] p-3">
			<div
				className={cn(
					"flex items-center gap-2 rounded-2xl border px-3 py-2 transition-colors",
					intent === "query" && "border-primary/40 bg-primary/5",
					intent === "task" &&
						"border-[rgba(var(--premium-success-rgb),0.40)] bg-[rgba(var(--premium-success-rgb),0.05)]",
					intent === "command" &&
						"border-[var(--border-default)] bg-[var(--surface-1)]",
				)}
			>
				{intent === "query" ? (
					<Sparkles className="h-4 w-4 text-primary" />
				) : intent === "task" ? (
					<BrainCircuit className="h-4 w-4 text-[var(--premium-success)]" />
				) : (
					<Command className="h-4 w-4 text-muted-foreground" />
				)}

				<input
					value={value}
					onChange={(event) => onChange(event.target.value)}
					onKeyDown={(event) => event.key === "Enter" && onSubmit()}
					placeholder={placeholder}
					className="h-10 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
					aria-label="Mensaje del Cognitive Hub"
				/>

				<button
					type="button"
					onClick={onSubmit}
					className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
					aria-label="Enviar al Cognitive Hub"
				>
					<SendHorizontal className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}
