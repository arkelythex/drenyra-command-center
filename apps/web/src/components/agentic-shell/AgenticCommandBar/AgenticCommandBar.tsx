import type { DrenyraAgentType } from "@drenyra/domain/drenyra";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUp, AtSign, Bot, Loader2, Paperclip, Slash } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { createThread } from "@/features/threads/threads.api";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";

const QUICK_REFERENCES = [
	{ id: "facturas", label: "facturas", description: "Facturas electrónicas" },
	{ id: "banco", label: "banco", description: "Movimientos bancarios" },
	{ id: "comprobantes", label: "comprobantes", description: "CPE / XML / CDR" },
	{ id: "cliente", label: "cliente", description: "Cliente activo" },
];

const SKILL_COMMANDS = [
	{ id: "sire", label: "sire", description: "Validate SIRE" },
	{ id: "close", label: "close", description: "Monthly close" },
	{ id: "audit", label: "audit", description: "Audit evidence" },
	{ id: "sunat", label: "sunat", description: "Query SUNAT" },
];

const AGENT_OPTIONS: { value: DrenyraAgentType; label: string }[] = [
	{ value: "SIRE_AGENT", label: "SIRE" },
	{ value: "CONCILIATION_AGENT", label: "Conciliation" },
	{ value: "LEDGER_AGENT", label: "Ledger" },
	{ value: "FISCAL_REVIEWER_AGENT", label: "Fiscal reviewer" },
	{ value: "EVIDENCE_AGENT", label: "Evidence" },
	{ value: "CPE_AGENT", label: "CPE" },
];

/**
 * AgenticCommandBar — always-visible input at the bottom of the shell.
 *
 * Supports @ references and / commands similar to Codex/Cursor.
 * Creates a new thread on submit.
 */
export function AgenticCommandBar() {
	const navigate = useNavigate();
	const { companyContext, fiscalPeriod } = useActiveCompanyContext();
	const inputRef = useRef<HTMLInputElement>(null);
	const evidenceInputRef = useRef<HTMLInputElement>(null);
	const [input, setInput] = useState("");
	const [showRefs, setShowRefs] = useState(false);
	const [showCommands, setShowCommands] = useState(false);
	const [selectedAgent, setSelectedAgent] =
		useState<DrenyraAgentType>("SIRE_AGENT");
	const [attachedEvidenceNames, setAttachedEvidenceNames] = useState<string[]>(
		[],
	);
	const [isCreating, setIsCreating] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isCreating) return;

		setIsCreating(true);
		try {
			const thread = await createThread({
				companyId: companyContext.companyId,
				title: input.trim().slice(0, 200),
				description: [
					`Agent: ${selectedAgent}`,
					`Company: ${companyContext.companyName}`,
					`RUC: ${companyContext.ruc}`,
					fiscalPeriod ? `Period: ${fiscalPeriod}` : undefined,
					attachedEvidenceNames.length > 0
						? `Evidence context: ${attachedEvidenceNames.join(", ")}`
						: undefined,
				]
					.filter(Boolean)
					.join("\n"),
				period: fiscalPeriod ?? undefined,
				tasks: [
					{
						title: input.trim(),
						description: `Run with ${selectedAgent} under RUC ${companyContext.ruc}`,
					},
				],
			});
			navigate({
				to: "/drenyra/case/$threadId",
				params: { threadId: thread.id },
			});
			setInput("");
		} catch {
			// Fallback: navigate with search param if API fails
			navigate({
				to: "/drenyra",
				search: { q: encodeURIComponent(input.trim()) } as never,
			});
			setInput("");
		} finally {
			setIsCreating(false);
		}
	};

	const handleInputChange = (value: string) => {
		setInput(value);
		const activeToken = value.trimStart().split(/\s+/).at(-1) ?? "";
		setShowRefs(activeToken.startsWith("@"));
		setShowCommands(activeToken.startsWith("/"));
	};

	const handleEvidenceSelection = (files: FileList | null) => {
		const names = Array.from(files ?? []).map((file) => file.name);
		setAttachedEvidenceNames(names);
		if (names.length > 0 && !input.includes("@evidence")) {
			setInput((prev) => `${prev}${prev ? " " : ""}@evidence `);
		}
		inputRef.current?.focus();
	};

	const insertToken = (tag: string, prefix: "@" | "/") => {
		const lastAtIndex = input.lastIndexOf("@");
		const lastSlashIndex = input.lastIndexOf("/");
		const insertAt = Math.max(lastAtIndex, lastSlashIndex);
		const token = `${prefix}${tag} `;

		if (insertAt >= 0) {
			setInput(input.slice(0, insertAt) + token);
		} else {
			setInput((prev) => `${prev}${token}`);
		}
		setShowRefs(false);
		setShowCommands(false);
		inputRef.current?.focus();
	};

	return (
		<div className="relative border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
			<div className="mb-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
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
							onClick={() => insertToken(ref.label, "@")}
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
							onClick={() => insertToken(cmd.label, "/")}
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
				<input
					ref={evidenceInputRef}
					type="file"
					multiple
					className="hidden"
					onChange={(event) => handleEvidenceSelection(event.target.files)}
				/>
				<button
					type="button"
					onClick={() => evidenceInputRef.current?.click()}
					className="flex items-center justify-center rounded-md p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
					aria-label="Attach fiscal evidence"
					title={
						attachedEvidenceNames.length > 0
							? attachedEvidenceNames.join(", ")
							: "Attach fiscal evidence"
					}
				>
					<Paperclip size={14} />
				</button>
				<label className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
					<Bot size={12} className="text-[var(--text-muted)]" />
					<span className="sr-only">Agent</span>
					<select
						value={selectedAgent}
						onChange={(event) =>
							setSelectedAgent(event.target.value as DrenyraAgentType)
						}
						className="bg-transparent text-[10px] outline-none"
					>
						{AGENT_OPTIONS.map((agent) => (
							<option key={agent.value} value={agent.value}>
								{agent.label}
							</option>
						))}
					</select>
				</label>
				<div className="flex items-center gap-1">
					{QUICK_REFERENCES.slice(0, 3).map((ref) => (
						<button
							key={ref.id}
							type="button"
							onClick={() => insertToken(ref.label, "@")}
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
					placeholder="Ask Drenyra…  @facturas  /sire  /close"
					className="flex-1 bg-transparent text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
				/>

				<button
					type="submit"
					disabled={!input.trim() || isCreating}
					className="flex items-center justify-center rounded-md bg-[var(--color-primary)] p-1 text-white transition-opacity disabled:opacity-40"
				>
					{isCreating ? (
						<Loader2 size={14} className="animate-spin" />
					) : (
						<ArrowUp size={14} />
					)}
				</button>
			</form>
		</div>
	);
}
