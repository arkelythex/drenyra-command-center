import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, AtSign, Slash } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

const QUICK_REFERENCES = [
	{ id: "facturas", label: "facturas", description: "Facturas electrónicas" },
	{ id: "banco", label: "banco", description: "Movimientos bancarios" },
	{ id: "comprobantes", label: "comprobantes", description: "CPE / XML / CDR" },
	{ id: "cliente", label: "cliente", description: "Cliente activo" },
];

const SKILL_COMMANDS = [
	{ id: "sire", label: "sire", description: "Validar SIRE" },
	{ id: "close", label: "close", description: "Cierre mensual" },
	{ id: "audit", label: "audit", description: "Auditar evidencia" },
	{ id: "sunat", label: "sunat", description: "Consultar SUNAT" },
];

/**
 * AgenticCommandBar — always-visible input at the bottom of the shell.
 *
 * Supports @ references and / commands similar to Codex/Cursor.
 * Creates a new thread on submit.
 */
export function AgenticCommandBar() {
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState("");
	const [showRefs, setShowRefs] = useState(false);
	const [showCommands, setShowCommands] = useState(false);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;
		const encoded = encodeURIComponent(input.trim());
		navigate({ to: "/drenyra", search: { q: encoded } as never });
		setInput("");
	};

	const handleInputChange = (value: string) => {
		setInput(value);
		setShowRefs(value.includes("@") && !value.includes(" "));
		setShowCommands(value.includes("/") && !value.includes(" "));
	};

	const insertTag = (tag: string) => {
		const lastAtIndex = input.lastIndexOf("@");
		const lastSlashIndex = input.lastIndexOf("/");
		const insertAt = Math.max(lastAtIndex, lastSlashIndex);

		if (insertAt >= 0) {
			setInput(input.slice(0, insertAt) + `@${tag} `);
		} else {
			setInput((prev) => `${prev}@${tag} `);
		}
		setShowRefs(false);
		setShowCommands(false);
		inputRef.current?.focus();
	};

	return (
		<div className="relative border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
			{/* @ reference popover */}
			{showRefs && (
				<div className="absolute bottom-full left-3 mb-2 w-64 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1 shadow-lg">
					<p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						Referencias
					</p>
					{QUICK_REFERENCES.map((ref) => (
						<button
							key={ref.id}
							type="button"
							onClick={() => insertTag(ref.label)}
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
						>
							<AtSign size={12} className="text-[var(--color-primary)]" />
							<span className="font-medium">{ref.label}</span>
							<span className="ml-auto text-[10px] text-[var(--text-muted)]">
								{ref.description}
							</span>
						</button>
					))}
				</div>
			)}

			{/* / skill popover */}
			{showCommands && (
				<div className="absolute bottom-full left-3 mb-2 w-64 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-1 shadow-lg">
					<p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						Comandos
					</p>
					{SKILL_COMMANDS.map((cmd) => (
						<button
							key={cmd.id}
							type="button"
							onClick={() => insertTag(cmd.label)}
							className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
						>
							<Slash size={12} className="text-[var(--color-accent)]" />
							<span className="font-medium">{cmd.label}</span>
							<span className="ml-auto text-[10px] text-[var(--text-muted)]">
								{cmd.description}
							</span>
						</button>
					))}
				</div>
			)}

			<form onSubmit={handleSubmit} className="flex items-center gap-2">
				<div className="flex items-center gap-1">
					{QUICK_REFERENCES.slice(0, 3).map((ref) => (
						<button
							key={ref.id}
							type="button"
							onClick={() => insertTag(ref.label)}
							className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--surface-2)]"
						>
							<AtSign size={10} />
							{ref.label}
						</button>
					))}
				</div>

				<input
					ref={inputRef}
					type="text"
					value={input}
					onChange={(e) => handleInputChange(e.target.value)}
					placeholder="Ask Drenyra anything...  @facturas  /sire  /close"
					className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
				/>

				<button
					type="submit"
					disabled={!input.trim()}
					className="flex items-center justify-center rounded-md bg-[var(--color-primary)] p-1 text-white transition-opacity disabled:opacity-40"
				>
					<ArrowUp size={14} />
				</button>
			</form>
		</div>
	);
}
