import { useEffect, useRef, useState } from "react";
import type { ChatMessage, RichContent } from "./agent-types";
import { ChatSidebar } from "./ChatSidebar";
import { findBestAdapter } from "./feature-adapters";
import { threadStore, useThreadStore } from "./thread-store";

let msgCounter = 0;
function nextId() {
	msgCounter++;
	return `msg-${String(msgCounter).padStart(4, "0")}`;
}

export function ChatAgent() {
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const store = useThreadStore();
	const activeThread = store.activeThread;

	// Auto-scroll on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [activeThread?.messages.length]);

	const handleSend = async () => {
		const text = input.trim();
		if (!text || loading || !activeThread) return;

		setInput("");
		setLoading(true);

		threadStore.addMessage(activeThread.id, {
			id: nextId(),
			role: "user",
			text,
			timestamp: new Date(),
		});

		try {
			const best = findBestAdapter(text);
			const response = best
				? await best.adapter.handle(best.match)
				: {
						id: nextId(),
						role: "assistant" as const,
						text: 'No entendí tu consulta. Probá con:\n\n- *"IGV de julio 2026"*\n- *"qué hay pendiente"*\n- *"qué sabes hacer"*',
						timestamp: new Date(),
					};

			threadStore.addMessage(activeThread.id, response);
		} catch {
			threadStore.addMessage(activeThread.id, {
				id: nextId(),
				role: "assistant",
				text: "Ocurrió un error. Probá de nuevo.",
				timestamp: new Date(),
			});
		} finally {
			setLoading(false);
		}
	};

	const handleNewThread = () => {
		threadStore.createThread("Nueva consulta", undefined);
	};

	const handleSelectThread = (id: string) => {
		threadStore.setActiveThread(id);
	};

	return (
		<div className="flex h-full">
			<ChatSidebar
				activeThreadId={store.activeThreadId}
				onSelectThread={handleSelectThread}
				onNewThread={handleNewThread}
			/>

			<div
				className="flex-1 flex flex-col"
				style={{ backgroundColor: "var(--surface-1)" }}
			>
				{activeThread ? (
					<>
						{/* Thread Header */}
						<div
							className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
							style={{ borderColor: "var(--border)" }}
						>
							<div className="flex items-center gap-2 min-w-0">
								<span
									className="text-sm font-semibold truncate"
									style={{ color: "var(--text-primary)" }}
								>
									{activeThread.title}
								</span>
								<span
									className="text-xs shrink-0"
									style={{ color: "var(--text-secondary)" }}
								>
									{activeThread.messages.length} msgs
								</span>
							</div>
							{activeThread.projectId && (
								<span
									className="text-xs shrink-0"
									style={{ color: "var(--text-secondary)" }}
								>
									📁 {threadStore.getProject(activeThread.projectId)?.name}
								</span>
							)}
						</div>

						{/* Messages */}
						<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
							{activeThread.messages.map((msg) => (
								<MessageRow key={msg.id} message={msg} />
							))}
							{loading && (
								<div
									className="flex items-center gap-2 py-3 px-4 text-sm"
									style={{ color: "var(--text-secondary)" }}
								>
									<span
										className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
										style={{
											borderColor:
												"var(--accent) transparent transparent transparent",
										}}
									/>
									Procesando...
								</div>
							)}
							<div ref={messagesEndRef} />
						</div>

						{/* Input */}
						<div
							className="border-t px-4 py-3 shrink-0"
							style={{
								borderColor: "var(--border)",
								backgroundColor: "var(--surface-2)",
							}}
						>
							<div className="flex gap-2 max-w-3xl mx-auto">
								<input
									type="text"
									value={input}
									onChange={(e) => setInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === "Enter" && !e.shiftKey) {
											e.preventDefault();
											handleSend();
										}
									}}
									placeholder={`Escribí lo que necesitás...`}
									className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors"
									style={{
										borderColor: "var(--border)",
										backgroundColor: "var(--surface-1)",
										color: "var(--text-primary)",
									}}
									disabled={loading}
								/>
								<button
									type="submit"
									onClick={handleSend}
									disabled={loading || !input.trim()}
									className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-40"
									style={{ backgroundColor: "var(--accent)" }}
								>
									{loading ? "..." : "Enviar"}
								</button>
							</div>
						</div>
					</>
				) : (
					<div
						className="flex-1 flex items-center justify-center text-sm"
						style={{ color: "var(--text-secondary)" }}
					>
						Seleccioná o creá un thread para empezar
					</div>
				)}
			</div>
		</div>
	);
}

// ─── Message Row ────────────────────────────────────────────────────────

function MessageRow({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className="max-w-[80%] rounded-2xl px-4 py-3"
				style={{
					backgroundColor: isUser ? "var(--accent)" : "var(--surface-2)",
					color: isUser ? "#fff" : "var(--text-primary)",
				}}
			>
				<MessageText text={message.text} />
				{message.richContent && (
					<div className="mt-3">
						<RichRenderer content={message.richContent} />
					</div>
				)}
				<div
					className="mt-1.5 text-xs opacity-60"
					style={{
						color: isUser ? "rgba(255,255,255,0.7)" : "var(--text-secondary)",
					}}
				>
					{message.timestamp.toLocaleTimeString("es-PE", {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</div>
			</div>
		</div>
	);
}

function MessageText({ text }: { text: string }) {
	if (!text.includes("**"))
		return (
			<div className="text-sm whitespace-pre-wrap leading-relaxed">{text}</div>
		);
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	return (
		<div className="text-sm whitespace-pre-wrap leading-relaxed">
			{parts.map((part, i) =>
				part.startsWith("**") && part.endsWith("**") ? (
					<strong key={i}>{part.slice(2, -2)}</strong>
				) : (
					<span key={i}>{part}</span>
				),
			)}
		</div>
	);
}

// ─── Rich Content ───────────────────────────────────────────────────────

function RichRenderer({ content }: { content: RichContent }) {
	switch (content.kind) {
		case "approval-list":
			return <ApprovalList data={content.data as any[]} />;
		case "approval-card":
			return <ApprovalCard data={content.data as any} />;
		case "skill-list":
			return <SkillList data={content.data as any[]} />;
		case "automation-list":
			return <AutomationList data={content.data as any[]} />;
		case "feature-grid":
			return <FeatureGrid data={content.data as any[]} />;
		case "consulta-result":
			return <ConsultaResult data={content.data as any} />;
		default:
			return null;
	}
}

function FeatureGrid({
	data,
}: {
	data: { id: string; label: string; desc: string }[];
}) {
	return (
		<div className="grid grid-cols-2 gap-1.5 mt-2">
			{data.map((f) => (
				<div
					key={f.id}
					className="rounded-lg px-3 py-2 text-xs"
					style={{ backgroundColor: "var(--surface-3)" }}
				>
					<div className="font-medium" style={{ color: "var(--text-primary)" }}>
						{f.label}
					</div>
					<div style={{ color: "var(--text-secondary)" }}>{f.desc}</div>
				</div>
			))}
		</div>
	);
}

function ApprovalList({
	data,
}: {
	data: {
		id: string;
		descripcion: string;
		monto: number;
		moneda: string;
		confianza: number;
	}[];
}) {
	return (
		<div className="space-y-1.5 mt-2">
			{data.map((r) => (
				<div
					key={r.id}
					className="rounded-lg px-3 py-2 text-xs"
					style={{ backgroundColor: "var(--surface-3)" }}
				>
					<div className="flex items-center justify-between">
						<span className="font-medium" style={{ color: "var(--accent)" }}>
							{r.id}
						</span>
						<span style={{ color: "var(--text-secondary)" }}>
							{(r.confianza * 100).toFixed(0)}%
						</span>
					</div>
					<div style={{ color: "var(--text-primary)" }}>{r.descripcion}</div>
					<div className="font-medium" style={{ color: "var(--text-primary)" }}>
						{r.moneda} {r.monto.toFixed(2)}
					</div>
				</div>
			))}
		</div>
	);
}

function ApprovalCard({
	data,
}: {
	data: {
		id: string;
		descripcion: string;
		monto: number;
		moneda: string;
		confianza: number;
	};
}) {
	return (
		<div
			className="rounded-lg border mt-2 p-3 text-xs"
			style={{
				borderColor: "var(--border)",
				backgroundColor: "var(--surface-3)",
			}}
		>
			<div className="font-medium" style={{ color: "var(--accent)" }}>
				{data.id}
			</div>
			<div style={{ color: "var(--text-primary)" }}>{data.descripcion}</div>
			<div className="font-semibold" style={{ color: "var(--text-primary)" }}>
				{data.moneda} {data.monto.toFixed(2)}
			</div>
			<div style={{ color: "var(--text-secondary)" }}>
				{(data.confianza * 100).toFixed(0)}% confianza
			</div>
		</div>
	);
}

function SkillList({
	data,
}: {
	data: { name: string; desc: string; status: string }[];
}) {
	return (
		<div className="space-y-1 mt-2">
			{data.map((s) => (
				<div
					key={s.name}
					className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
					style={{ backgroundColor: "var(--surface-3)" }}
				>
					<div>
						<div
							className="font-medium"
							style={{ color: "var(--text-primary)" }}
						>
							{s.name}
						</div>
						<div style={{ color: "var(--text-secondary)" }}>{s.desc}</div>
					</div>
					<span
						className="px-2 py-0.5 rounded-full text-xs"
						style={{
							backgroundColor:
								s.status === "active"
									? "var(--success-bg, #dcfce7)"
									: "var(--surface-3)",
							color:
								s.status === "active"
									? "var(--success, #16a34a)"
									: "var(--text-secondary)",
						}}
					>
						{s.status}
					</span>
				</div>
			))}
		</div>
	);
}

function AutomationList({
	data,
}: {
	data: { name: string; desc: string; schedule: string; status: string }[];
}) {
	return (
		<div className="space-y-1 mt-2">
			{data.map((a) => (
				<div
					key={a.name}
					className="rounded-lg px-3 py-2 text-xs"
					style={{ backgroundColor: "var(--surface-3)" }}
				>
					<div className="flex items-center justify-between">
						<span
							className="font-medium"
							style={{ color: "var(--text-primary)" }}
						>
							{a.name}
						</span>
						<span
							className="px-2 py-0.5 rounded-full text-xs"
							style={{
								backgroundColor:
									a.status === "active"
										? "var(--success-bg, #dcfce7)"
										: "var(--surface-3)",
								color:
									a.status === "active"
										? "var(--success, #16a34a)"
										: "var(--text-secondary)",
							}}
						>
							{a.status}
						</span>
					</div>
					<div style={{ color: "var(--text-secondary)" }}>{a.desc}</div>
					<div style={{ color: "var(--text-secondary)" }}>⏰ {a.schedule}</div>
				</div>
			))}
		</div>
	);
}

function ConsultaResult({ data }: { data: any }) {
	return (
		<div
			className="rounded-lg border mt-2 p-3 text-xs"
			style={{
				borderColor: "var(--border)",
				backgroundColor: "var(--surface-3)",
			}}
		>
			<div className="grid grid-cols-3 gap-2 text-center">
				<div>
					<div style={{ color: "var(--text-secondary)" }}>IGV Compra</div>
					<div
						className="font-semibold"
						style={{ color: "var(--text-primary)" }}
					>
						PEN{" "}
						{Number(data.igvCompra ?? 0).toLocaleString("es-PE", {
							minimumFractionDigits: 2,
						})}
					</div>
				</div>
				<div>
					<div style={{ color: "var(--text-secondary)" }}>IGV Venta</div>
					<div
						className="font-semibold"
						style={{ color: "var(--text-primary)" }}
					>
						PEN{" "}
						{Number(data.igvVenta ?? 0).toLocaleString("es-PE", {
							minimumFractionDigits: 2,
						})}
					</div>
				</div>
				<div>
					<div style={{ color: "var(--text-secondary)" }}>Confianza</div>
					<div
						className="font-semibold"
						style={{ color: "var(--success, #16a34a)" }}
					>
						92%
					</div>
				</div>
			</div>
		</div>
	);
}
