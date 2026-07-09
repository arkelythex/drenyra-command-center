import { useState, useEffect } from "react";

interface Source {
	tipo: string;
	serie: string;
	numero: number;
	monto: number;
	moneda: string;
	cdrHash?: string;
	fecha: string;
}

interface PhaseEvidence {
	phase: string;
	status: string;
	hash: string;
	duration: string;
}

interface RecDetail {
	id: string;
	pipelineRunId: string;
	tipoAccion: string;
	ruc: string;
	periodo: string;
	descripcion: string;
	monto: number;
	moneda: string;
	confianza: number;
	fuentes: Source[];
	status: string;
	creado: string;
	aprobadoPor?: string;
	aprobadoEn?: string;
	motivoRechazo?: string;
}

interface ApprovalDetailPageProps {
	recId: string;
}

export function ApprovalDetailPage({ recId }: ApprovalDetailPageProps) {
	const [rec, setRec] = useState<RecDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [rejectMotivo, setRejectMotivo] = useState("");
	const [showRejectForm, setShowRejectForm] = useState(false);

	useEffect(() => {
		loadDetail();
	}, [recId]);

	const loadDetail = async () => {
		try {
			const res = await fetch(`/api/approval/${recId}`);
			const data = await res.json();
			if (data.ok) {
				setRec(data.data);
			} else {
				setError(data.error ?? "Recomendación no encontrada");
			}
		} catch {
			// Mock detail
			setRec({
				id: recId,
				pipelineRunId: "pipe-igv-julio-2026",
				tipoAccion: "contabilizar-igv",
				ruc: "20123456789",
				periodo: "2026-07",
				descripcion: "Contabilizar IGV por S/ 18,234.50",
				monto: 18234.5,
				moneda: "PEN",
				confianza: 0.92,
				fuentes: [
					{
						tipo: "factura-compra",
						serie: "F001",
						numero: 123,
						monto: 450,
						moneda: "PEN",
						cdrHash: "abc123def456",
						fecha: "2026-07-05",
					},
					{
						tipo: "factura-compra",
						serie: "F001",
						numero: 124,
						monto: 1200,
						moneda: "PEN",
						cdrHash: "def789abc012",
						fecha: "2026-07-12",
					},
					{
						tipo: "factura-compra",
						serie: "F001",
						numero: 125,
						monto: 3400,
						moneda: "PEN",
						cdrHash: "ghi345jkl678",
						fecha: "2026-07-18",
					},
					{
						tipo: "factura-venta",
						serie: "B001",
						numero: 50,
						monto: 5600,
						moneda: "PEN",
						cdrHash: "mno901pqr234",
						fecha: "2026-07-20",
					},
				],
				status: "pending",
				creado: "2026-07-09T14:30:00Z",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleApprove = async () => {
		try {
			const res = await fetch(`/api/approval/${recId}/approve`, {
				method: "POST",
			});
			const data = await res.json();
			if (data.ok) {
				setRec((prev) =>
					prev
						? {
								...prev,
								status: "approved",
								aprobadoPor: "contador@drenyra",
								aprobadoEn: new Date().toISOString(),
							}
						: null,
				);
			}
		} catch {
			// Local optimistic update
			setRec((prev) =>
				prev
					? {
							...prev,
							status: "approved",
							aprobadoPor: "contador@drenyra",
							aprobadoEn: new Date().toISOString(),
						}
					: null,
			);
		}
	};

	const handleReject = async () => {
		if (!rejectMotivo.trim()) return;
		try {
			const res = await fetch(`/api/approval/${recId}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ motivo: rejectMotivo }),
			});
			const data = await res.json();
			if (data.ok) {
				setRec((prev) =>
					prev
						? {
								...prev,
								status: "rejected",
								motivoRechazo: rejectMotivo,
								aprobadoPor: "contador@drenyra",
								aprobadoEn: new Date().toISOString(),
							}
						: null,
				);
			}
		} catch {
			setRec((prev) =>
				prev
					? { ...prev, status: "rejected", motivoRechazo: rejectMotivo }
					: null,
			);
		}
	};

	if (loading) {
		return (
			<div
				className="flex items-center justify-center h-64"
				style={{ color: "var(--text-secondary)" }}
			>
				Cargando recomendación...
			</div>
		);
	}

	if (error || !rec) {
		return (
			<div
				className="p-8 text-center"
				style={{ color: "var(--danger, #dc2626)" }}
			>
				⚠ {error || "Recomendación no encontrada"}
			</div>
		);
	}

	const pipelinePhases: PhaseEvidence[] = [
		{ phase: "Solicitud", status: "✅", hash: "0xa1b2c3", duration: "1.2s" },
		{ phase: "Análisis", status: "✅", hash: "0xd4e5f6", duration: "3.4s" },
		{ phase: "Diseño", status: "✅", hash: "0x7g8h9i", duration: "2.1s" },
		{ phase: "Plan", status: "✅", hash: "0x0j1k2l", duration: "1.8s" },
		{
			phase: "Migración",
			status:
				rec.status === "pending"
					? "⏳"
					: rec.status === "approved"
						? "✅"
						: "❌",
			hash: rec.status === "approved" ? "0x3m4n5o" : "—",
			duration: rec.status === "approved" ? "5.2s" : "—",
		},
		{
			phase: "Auditoría",
			status: rec.status === "approved" ? "✅" : "⏳",
			hash: rec.status === "approved" ? "0x6p7q8r" : "—",
			duration: rec.status === "approved" ? "2.9s" : "—",
		},
	];

	return (
		<div
			className="flex-1 overflow-auto custom-scrollbar"
			style={{ backgroundColor: "var(--surface-1)" }}
		>
			<div className="mx-auto w-full max-w-[900px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={() => window.history.back()}
								className="text-lg"
								style={{ color: "var(--text-secondary)" }}
							>
								←
							</button>
							<div>
								<h1
									className="text-2xl font-bold tracking-tight"
									style={{ color: "var(--text-primary)" }}
								>
									{rec.id}: {rec.descripcion}
								</h1>
								<p
									className="mt-1 text-sm"
									style={{ color: "var(--text-secondary)" }}
								>
									RUC {rec.ruc} | Período {rec.periodo}
								</p>
							</div>
						</div>
						<StatusBadge status={rec.status} />
					</div>

					{/* Status Banner for approved/rejected */}
					{rec.status !== "pending" && (
						<div
							className="rounded-xl border p-4"
							style={{
								borderColor:
									rec.status === "approved"
										? "var(--success-border, #bbf7d0)"
										: "var(--danger-border, #fecaca)",
								backgroundColor:
									rec.status === "approved"
										? "var(--success-bg, #f0fdf4)"
										: "var(--danger-bg, #fef2f2)",
							}}
						>
							<div className="flex items-center gap-2">
								<span className="text-xl">
									{rec.status === "approved" ? "✅" : "❌"}
								</span>
								<div>
									<p
										className="font-medium"
										style={{
											color:
												rec.status === "approved"
													? "var(--success, #16a34a)"
													: "var(--danger, #dc2626)",
										}}
									>
										{rec.status === "approved" ? "Aprobada" : "Rechazada"}
									</p>
									<p
										className="text-xs mt-0.5"
										style={{ color: "var(--text-secondary)" }}
									>
										Por {rec.aprobadoPor} el{" "}
										{rec.aprobadoEn
											? new Date(rec.aprobadoEn).toLocaleString("es-PE")
											: "—"}
										{rec.motivoRechazo && ` | Motivo: ${rec.motivoRechazo}`}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Detail Cards */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						<DetailCard label="Acción" value={rec.tipoAccion} />
						<DetailCard
							label="Monto"
							value={`${rec.moneda} ${rec.monto.toFixed(2)}`}
						/>
						<DetailCard
							label="Confianza"
							value={`${(rec.confianza * 100).toFixed(0)}%`}
						/>
						<DetailCard label="Pipeline" value={rec.pipelineRunId} />
					</div>

					{/* Approval Actions */}
					{rec.status === "pending" && (
						<div
							className="rounded-xl border p-5"
							style={{
								borderColor: "var(--border)",
								backgroundColor: "var(--surface-2)",
							}}
						>
							<h2
								className="text-base font-semibold mb-4"
								style={{ color: "var(--text-primary)" }}
							>
								⚡ Acción requerida
							</h2>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={handleApprove}
									className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
									style={{ backgroundColor: "var(--success, #16a34a)" }}
								>
									✅ Aprobar
								</button>
								<button
									type="button"
									onClick={() => setShowRejectForm(!showRejectForm)}
									className="flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90"
									style={{ backgroundColor: "var(--danger, #dc2626)" }}
								>
									❌ Rechazar
								</button>
							</div>
							{showRejectForm && (
								<div className="mt-3 flex gap-2">
									<input
										type="text"
										value={rejectMotivo}
										onChange={(e) => setRejectMotivo(e.target.value)}
										placeholder="Motivo del rechazo (obligatorio)"
										className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
										style={{
											borderColor: "var(--border)",
											backgroundColor: "var(--surface-1)",
											color: "var(--text-primary)",
										}}
									/>
									<button
										type="button"
										onClick={handleReject}
										disabled={!rejectMotivo.trim()}
										className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
										style={{ backgroundColor: "var(--danger, #dc2626)" }}
									>
										Confirmar
									</button>
								</div>
							)}
						</div>
					)}

					{/* Evidence Sources */}
					<EvidenceViewer fuentes={rec.fuentes} />

					{/* Pipeline Timeline */}
					<div
						className="rounded-xl border p-5"
						style={{
							borderColor: "var(--border)",
							backgroundColor: "var(--surface-2)",
						}}
					>
						<h2
							className="text-base font-semibold mb-4"
							style={{ color: "var(--text-primary)" }}
						>
							📜 Pipeline Timeline
						</h2>
						<div className="space-y-0">
							{pipelinePhases.map((phase, i) => (
								<div key={phase.phase} className="flex items-start gap-3 py-2">
									<div className="flex flex-col items-center">
										<div
											className="w-3 h-3 rounded-full flex items-center justify-center text-xs"
											style={{
												backgroundColor:
													phase.status === "✅"
														? "var(--success, #16a34a)"
														: phase.status === "⏳"
															? "var(--warning, #ca8a04)"
															: "var(--danger, #dc2626)",
											}}
										></div>
										{i < pipelinePhases.length - 1 && (
											<div
												className="w-0.5 h-6"
												style={{ backgroundColor: "var(--border)" }}
											/>
										)}
									</div>
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<span
												className="text-sm font-medium"
												style={{ color: "var(--text-primary)" }}
											>
												{phase.phase} {phase.status}
											</span>
											<span
												className="text-xs"
												style={{ color: "var(--text-secondary)" }}
											>
												{phase.duration}
											</span>
										</div>
										<div
											className="text-xs font-mono mt-0.5"
											style={{ color: "var(--text-secondary)" }}
										>
											Hash: {phase.hash}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Audit Log */}
					<div
						className="rounded-xl border p-5"
						style={{
							borderColor: "var(--border)",
							backgroundColor: "var(--surface-2)",
						}}
					>
						<h2
							className="text-base font-semibold mb-2"
							style={{ color: "var(--text-primary)" }}
						>
							📝 Historial
						</h2>
						<div
							className="space-y-1 text-xs"
							style={{ color: "var(--text-secondary)" }}
						>
							<div className="flex justify-between py-1">
								<span>Creada por pipeline {rec.pipelineRunId}</span>
								<span>{new Date(rec.creado).toLocaleString("es-PE")}</span>
							</div>
							{rec.aprobadoEn && (
								<div className="flex justify-between py-1">
									<span>
										{rec.status === "approved" ? "✅ Aprobada" : "❌ Rechazada"}{" "}
										por {rec.aprobadoPor}
									</span>
									<span>
										{new Date(rec.aprobadoEn).toLocaleString("es-PE")}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function EvidenceViewer({ fuentes }: { fuentes: Source[] }) {
	const [expanded, setExpanded] = useState(false);
	const visible = expanded ? fuentes : fuentes.slice(0, 3);

	return (
		<div
			className="rounded-xl border p-5"
			style={{
				borderColor: "var(--border)",
				backgroundColor: "var(--surface-2)",
			}}
		>
			<h2
				className="text-base font-semibold mb-3"
				style={{ color: "var(--text-primary)" }}
			>
				📎 Evidencia ({fuentes.length} fuente(s))
			</h2>
			<div className="space-y-1.5">
				{visible.map((f, i) => (
					<div
						key={i}
						className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
						style={{ backgroundColor: "var(--surface-3)" }}
					>
						<div className="flex items-center gap-4">
							<span
								className="font-medium"
								style={{ color: "var(--text-primary)" }}
							>
								{f.serie}-{String(f.numero).padStart(3, "0")}
							</span>
							<span style={{ color: "var(--text-secondary)" }}>{f.tipo}</span>
						</div>
						<div className="flex items-center gap-4">
							<span style={{ color: "var(--text-primary)" }}>
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
							<span style={{ color: "var(--text-secondary)" }}>{f.fecha}</span>
							{f.cdrHash && (
								<span
									className="font-mono"
									style={{ color: "var(--text-secondary)" }}
									title={f.cdrHash}
								>
									{f.cdrHash.slice(0, 8)}...
								</span>
							)}
						</div>
					</div>
				))}
			</div>
			{fuentes.length > 3 && (
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="mt-2 text-xs font-medium transition-colors"
					style={{ color: "var(--accent)" }}
				>
					{expanded ? "Mostrar menos ▲" : `Mostrar todas (${fuentes.length}) ▼`}
				</button>
			)}
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const config: Record<string, { label: string; bg: string; color: string }> = {
		pending: {
			label: "Pendiente",
			bg: "var(--warning-bg, #fef9c3)",
			color: "var(--warning, #ca8a04)",
		},
		approved: {
			label: "Aprobada",
			bg: "var(--success-bg, #dcfce7)",
			color: "var(--success, #16a34a)",
		},
		rejected: {
			label: "Rechazada",
			bg: "var(--danger-bg, #fef2f2)",
			color: "var(--danger, #dc2626)",
		},
		timeout: { label: "Timeout", bg: "#f3f4f6", color: "#6b7280" },
	};
	const c = config[status] ?? {
		label: status,
		bg: "#f3f4f6",
		color: "#6b7280",
	};
	return (
		<span
			className="text-xs font-medium px-3 py-1 rounded-full"
			style={{ backgroundColor: c.bg, color: c.color }}
		>
			{c.label}
		</span>
	);
}

function DetailCard({ label, value }: { label: string; value: string }) {
	return (
		<div
			className="rounded-lg p-3 text-center"
			style={{ backgroundColor: "var(--surface-2)" }}
		>
			<div
				className="text-xs mb-0.5"
				style={{ color: "var(--text-secondary)" }}
			>
				{label}
			</div>
			<div
				className="text-sm font-semibold"
				style={{ color: "var(--text-primary)" }}
			>
				{value}
			</div>
		</div>
	);
}
