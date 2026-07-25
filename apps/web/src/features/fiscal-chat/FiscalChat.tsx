import { approvalStore } from "@drenyra/fiscal-approval";
import { useEffect, useRef, useState } from "react";
import { getSuggestions, parseChatInput } from "./chat-parser";
import type {
	ChatMessage,
	ConsultaData,
	EvidenceSource,
	RecommendationData,
} from "./chat-types";

let msgId = 0;
function nextId() {
	msgId++;
	return `msg-${String(msgId).padStart(3, "0")}`;
}

/** Sample data when API is unavailable */
const SAMPLE_RECS: RecommendationData[] = [
	{
		id: "REC-001",
		descripcion: "Contabilizar IGV julio 2026",
		monto: 18234.5,
		moneda: "PEN",
		confianza: 0.92,
		status: "pending",
		ruc: "20123456789",
		periodo: "2026-07",
		fuentes: [
			{
				tipo: "factura-compra",
				serie: "F001",
				numero: 123,
				monto: 450,
				moneda: "PEN",
				cdrHash: "abc123",
				fecha: "2026-07-05",
			},
		],
	},
	{
		id: "REC-002",
		descripcion: "Aplicar detracción F001-125",
		monto: 450,
		moneda: "PEN",
		confianza: 0.88,
		status: "pending",
		ruc: "20123456789",
		periodo: "2026-07",
		fuentes: [
			{
				tipo: "factura-compra",
				serie: "F001",
				numero: 125,
				monto: 450,
				moneda: "PEN",
				cdrHash: "def456",
				fecha: "2026-07-12",
			},
		],
	},
];

const SAMPLE_CONSULTA: ConsultaData = {
	tipo: "igv-consulta",
	ruc: "20123456789",
	periodo: "2026-07",
	resultado: {
		monto: 18234.5,
		moneda: "PEN",
		igvCompra: 18234.5,
		igvVenta: 9876.0,
	},
	confianza: 0.92,
	fuentes: [
		{
			tipo: "factura-compra",
			serie: "F001",
			numero: 123,
			monto: 450,
			moneda: "PEN",
			cdrHash: "abc123",
			fecha: "2026-07-05",
		},
		{
			tipo: "factura-compra",
			serie: "F001",
			numero: 124,
			monto: 1200,
			moneda: "PEN",
			cdrHash: "def456",
			fecha: "2026-07-12",
		},
		{
			tipo: "factura-venta",
			serie: "B001",
			numero: 50,
			monto: 5600,
			moneda: "PEN",
			cdrHash: "ghi789",
			fecha: "2026-07-20",
		},
	],
};

export function FiscalChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: nextId(),
			role: "assistant",
			text: "¡Hola! Soy tu asistente fiscal. Podés preguntarme sobre IGV, detracciones, SIRE, o gestionar recomendaciones.",
			timestamp: new Date(),
		},
	]);
	const [input, setInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [suggestions] = useState(getSuggestions());
	const [showSuggestions, setShowSuggestions] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const addMessage = (msg: ChatMessage) => {
		setMessages((prev) => [...prev, msg]);
	};

	const handleSend = async () => {
		const text = input.trim();
		if (!text || loading) return;

		setInput("");
		setShowSuggestions(false);

		// Add user message
		addMessage({ id: nextId(), role: "user", text, timestamp: new Date() });
		setLoading(true);

		try {
			const parsed = parseChatInput(text);
			const response = await processIntent(parsed);
			addMessage(response);
		} catch {
			addMessage({
				id: nextId(),
				role: "assistant",
				text: "Ocurrió un error al procesar tu consulta. Probá de nuevo.",
				timestamp: new Date(),
				content: { kind: "error", data: [] as EvidenceSource[] },
			});
		} finally {
			setLoading(false);
		}
	};

	const processIntent = async (
		parsed: ReturnType<typeof parseChatInput>,
	): Promise<ChatMessage> => {
		switch (parsed.intent) {
			case "approve": {
				const rec =
					approvalStore.get(parsed.entityId ?? "") ??
					SAMPLE_RECS.find((r) => r.id === parsed.entityId);
				if (!rec) {
					return {
						id: nextId(),
						role: "assistant",
						text: `No encontré ${parsed.entityId}. Usá "qué hay pendiente" para ver las recomendaciones activas.`,
						timestamp: new Date(),
					};
				}
				const approved = approvalStore.approve(
					parsed.entityId!,
					"contador@drenyra",
				) ?? { ...rec, status: "approved" };
				return {
					id: nextId(),
					role: "assistant",
					text: `✅ **${parsed.entityId} aprobada**\n\n${approved.descripcion}\nMonto: ${approved.moneda} ${approved.monto.toFixed(2)}\nConfianza: ${(approved.confianza * 100).toFixed(0)}%`,
					timestamp: new Date(),
					content: {
						kind: "approval-card",
						data: { ...approved, fuentes: rec.fuentes ?? [] },
					},
				};
			}

			case "reject": {
				if (!parsed.motivo) {
					return {
						id: nextId(),
						role: "assistant",
						text: `Para rechazar necesito un motivo. Ej: "rechaza ${parsed.entityId} --motivo período incorrecto"`,
						timestamp: new Date(),
					};
				}
				const rec =
					approvalStore.get(parsed.entityId ?? "") ??
					SAMPLE_RECS.find((r) => r.id === parsed.entityId);
				if (!rec) {
					return {
						id: nextId(),
						role: "assistant",
						text: `No encontré ${parsed.entityId}.`,
						timestamp: new Date(),
					};
				}
				approvalStore.reject(
					parsed.entityId!,
					"contador@drenyra",
					parsed.motivo,
				);
				return {
					id: nextId(),
					role: "assistant",
					text: `❌ **${parsed.entityId} rechazada**\n\nMotivo: ${parsed.motivo}\n\nAcción NO ejecutada.`,
					timestamp: new Date(),
				};
			}

			case "show-detail": {
				const rec = SAMPLE_RECS.find((r) => r.id === parsed.entityId);
				if (!rec) {
					return {
						id: nextId(),
						role: "assistant",
						text: `No encontré ${parsed.entityId}.`,
						timestamp: new Date(),
					};
				}
				const fuentes = rec.fuentes ?? [];
				return {
					id: nextId(),
					role: "assistant",
					text: `📋 **${rec.id}: ${rec.descripcion}**\n\nRUC: ${rec.ruc}\nPeríodo: ${rec.periodo}\nMonto: ${rec.moneda} ${rec.monto.toFixed(2)}\nConfianza: ${(rec.confianza * 100).toFixed(0)}%\nEstado: ${rec.status}\n\n📎 ${fuentes.length} fuente(s) de evidencia`,
					timestamp: new Date(),
					content: { kind: "evidence", data: fuentes },
				};
			}

			case "list-pending": {
				const all = approvalStore.list({ status: "pending" });
				const recs =
					all.length > 0
						? all
						: SAMPLE_RECS.filter((r) => r.status === "pending");
				if (recs.length === 0) {
					return {
						id: nextId(),
						role: "assistant",
						text: "No hay recomendaciones pendientes. Hacé una consulta fiscal para generar nuevas.",
						timestamp: new Date(),
					};
				}
				return {
					id: nextId(),
					role: "assistant",
					text: `📋 **${recs.length} recomendación(es) pendiente(s)**\n\nUsá "aprueba REC-001" o "rechaza REC-001 --motivo ..." para gestionarlas.`,
					timestamp: new Date(),
					content: {
						kind: "approval-list",
						data: recs.map((r: RecommendationData) => ({ ...r })),
					},
				};
			}
			default: {
				// Simulate query result
				await new Promise((r) => setTimeout(r, 500));
				const data = SAMPLE_CONSULTA;
				return {
					id: nextId(),
					role: "assistant",
					text: `📊 **${data.tipo === "igv-consulta" ? "IGV" : "Consulta"} — ${data.periodo}**\n\nRUC: ${data.ruc}\nIGV Compra: PEN ${Number(data.resultado.igvCompra ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}\nIGV Venta: PEN ${Number(data.resultado.igvVenta ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}\n\nConfianza: ${(data.confianza * 100).toFixed(0)}%\n📎 ${data.fuentes.length} factura(s)`,
					timestamp: new Date(),
					content: { kind: "consulta-result", data },
				};
			}
		}
	};

	return (
		<div
			className="flex flex-col h-full"
			style={{ backgroundColor: "var(--surface-1)" }}
		>
			{/* Header minimal tipo Codex */}
			<div
				className="flex items-center justify-between px-4 py-3 border-b shrink-0"
				style={{ borderColor: "var(--border)" }}
			>
				<div className="flex items-center gap-2">
					<span
						className="text-sm font-semibold"
						style={{ color: "var(--text-primary)" }}
					>
						Drenyra — Asistente Fiscal
					</span>
				</div>
				<div
					className="flex items-center gap-2 text-xs"
					style={{ color: "var(--text-secondary)" }}
				>
					<span>Panel Contable</span>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
				{messages.map((msg) => (
					<ChatMessageRow key={msg.id} message={msg} />
				))}

				{loading && (
					<div
						className="flex items-center gap-2 py-3 px-4"
						style={{ color: "var(--text-secondary)" }}
					>
						<div
							className="animate-spin h-4 w-4 border-2 rounded-full"
							style={{
								borderColor:
									"var(--accent) transparent transparent transparent",
							}}
						/>
						<span className="text-sm">Procesando...</span>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Suggestions (shown on first interaction) */}
			{showSuggestions && messages.length <= 2 && (
				<div className="px-4 pb-2">
					<div className="flex flex-wrap gap-1.5">
						{suggestions.map((s) => (
							<button
								key={s}
								type="button"
								onClick={() => {
									setInput(s);
									inputRef.current?.focus();
								}}
								className="text-xs rounded-full px-3 py-1.5 border transition-colors hover:bg-opacity-80"
								style={{
									borderColor: "var(--border)",
									color: "var(--text-secondary)",
									backgroundColor: "var(--surface-2)",
								}}
							>
								{s}
							</button>
						))}
					</div>
				</div>
			)}

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
						ref={inputRef}
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSend();
							}
						}}
						placeholder='Preguntame algo... ej: "IGV de julio 2026"'
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
						Enviar
					</button>
				</div>
			</div>
		</div>
	);
}

// ─── Message Row ────────────────────────────────────────────────────────

function ChatMessageRow({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";

	return (
		<div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? "" : ""}`}
				style={{
					backgroundColor: isUser ? "var(--accent)" : "var(--surface-2)",
					color: isUser ? "#fff" : "var(--text-primary)",
				}}
			>
				{/* Text */}
				<div
					className="text-sm whitespace-pre-wrap leading-relaxed"
					style={{ whiteSpace: "pre-wrap" }}
				>
					{message.text.split("\n").map((line, i) => (
						<span key={i}>
							{line.startsWith("**") && line.endsWith("**") ? (
								<strong>{line.slice(2, -2)}</strong>
							) : line.includes("**") ? (
								renderInlineBold(line)
							) : (
								line
							)}
							{i < message.text.split("\n").length - 1 && <br />}
						</span>
					))}
				</div>

				{/* Rich content */}
				{message.content && (
					<div className="mt-3">
						{message.content.kind === "consulta-result" && (
							<ConsultaResultCard data={message.content.data as ConsultaData} />
						)}
						{message.content.kind === "approval-card" && (
							<ApprovalCard data={message.content.data as RecommendationData} />
						)}
						{message.content.kind === "approval-list" && (
							<ApprovalList
								data={message.content.data as RecommendationData[]}
							/>
						)}
						{message.content.kind === "evidence" && (
							<EvidenceViewer data={message.content.data as EvidenceSource[]} />
						)}
					</div>
				)}

				{/* Timestamp */}
				<div
					className="mt-1 text-xs opacity-60"
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

function renderInlineBold(text: string): React.ReactNode {
	const parts = text.split(/(\*\*[^*]+\*\*)/g);
	return parts.map((part, i) =>
		part.startsWith("**") && part.endsWith("**") ? (
			<strong key={i}>{part.slice(2, -2)}</strong>
		) : (
			<span key={i}>{part}</span>
		),
	);
}

// ─── Rich Content Cards ─────────────────────────────────────────────────

function ConsultaResultCard({ data }: { data: ConsultaData }) {
	return (
		<div
			className="rounded-xl border mt-2"
			style={{
				borderColor: "var(--border)",
				backgroundColor: "var(--surface-3)",
			}}
		>
			<div className="grid grid-cols-3 gap-2 p-3">
				<div className="text-center">
					<div className="text-xs" style={{ color: "var(--text-secondary)" }}>
						IGV Compra
					</div>
					<div
						className="text-sm font-semibold"
						style={{ color: "var(--text-primary)" }}
					>
						PEN{" "}
						{Number(data.resultado.igvCompra ?? 0).toLocaleString("es-PE", {
							minimumFractionDigits: 2,
						})}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs" style={{ color: "var(--text-secondary)" }}>
						IGV Venta
					</div>
					<div
						className="text-sm font-semibold"
						style={{ color: "var(--text-primary)" }}
					>
						PEN{" "}
						{Number(data.resultado.igvVenta ?? 0).toLocaleString("es-PE", {
							minimumFractionDigits: 2,
						})}
					</div>
				</div>
				<div className="text-center">
					<div className="text-xs" style={{ color: "var(--text-secondary)" }}>
						Confianza
					</div>
					<div
						className="text-sm font-semibold"
						style={{
							color:
								data.confianza >= 0.7
									? "var(--success, #16a34a)"
									: "var(--warning, #ca8a04)",
						}}
					>
						{(data.confianza * 100).toFixed(0)}%
					</div>
				</div>
			</div>
			{data.fuentes.length > 0 && (
				<div
					className="border-t px-3 py-2"
					style={{ borderColor: "var(--border)" }}
				>
					<div className="text-xs" style={{ color: "var(--text-secondary)" }}>
						📎 {data.fuentes.length} fuente(s) —{" "}
						{data.fuentes
							.slice(0, 3)
							.map((f) => `${f.serie}-${String(f.numero).padStart(3, "0")}`)
							.join(", ")}
						{data.fuentes.length > 3 && ` y ${data.fuentes.length - 3} más`}
					</div>
				</div>
			)}
		</div>
	);
}

function ApprovalCard({ data }: { data: RecommendationData }) {
	return (
		<div
			className="rounded-xl border mt-2 p-3"
			style={{
				borderColor: "var(--border)",
				backgroundColor: "var(--surface-3)",
			}}
		>
			<div className="flex items-center justify-between mb-2">
				<span
					className="text-xs font-medium"
					style={{ color: "var(--accent)" }}
				>
					{data.id}
				</span>
				<span className="text-xs" style={{ color: "var(--text-secondary)" }}>
					{(data.confianza * 100).toFixed(0)}% confianza
				</span>
			</div>
			<div className="text-sm" style={{ color: "var(--text-primary)" }}>
				{data.descripcion}
			</div>
			<div
				className="text-sm font-semibold mt-1"
				style={{ color: "var(--text-primary)" }}
			>
				{data.moneda} {data.monto.toFixed(2)}
			</div>
		</div>
	);
}

function ApprovalList({ data }: { data: RecommendationData[] }) {
	return (
		<div className="space-y-1.5 mt-2">
			{data.map((rec) => (
				<div
					key={rec.id}
					className="rounded-lg px-3 py-2"
					style={{ backgroundColor: "var(--surface-3)" }}
				>
					<div className="flex items-center justify-between">
						<span
							className="text-xs font-medium"
							style={{ color: "var(--accent)" }}
						>
							{rec.id}
						</span>
						<span
							className="text-xs"
							style={{ color: "var(--text-secondary)" }}
						>
							{(rec.confianza * 100).toFixed(0)}%
						</span>
					</div>
					<div
						className="text-xs mt-0.5"
						style={{ color: "var(--text-primary)" }}
					>
						{rec.descripcion} — {rec.moneda} {rec.monto.toFixed(2)}
					</div>
				</div>
			))}
		</div>
	);
}

function EvidenceViewer({ data }: { data: EvidenceSource[] }) {
	if (!data || data.length === 0) return null;
	return (
		<div className="mt-2 space-y-1">
			{data.slice(0, 3).map((f, i) => (
				<div
					key={i}
					className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs"
					style={{ backgroundColor: "var(--surface-3)" }}
				>
					<span style={{ color: "var(--text-primary)" }}>
						{f.serie}-{String(f.numero).padStart(3, "0")}
					</span>
					<span style={{ color: "var(--text-secondary)" }}>
						{f.moneda} {f.monto.toFixed(2)}
					</span>
					<span
						style={{
							color: f.cdrHash
								? "var(--success, #16a34a)"
								: "var(--text-secondary)",
						}}
					>
						{f.cdrHash ? "CDR ✓" : "CDR —"}
					</span>
				</div>
			))}
		</div>
	);
}
