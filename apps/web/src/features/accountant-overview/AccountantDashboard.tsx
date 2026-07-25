import { useEffect, useState } from "react";

interface SummaryData {
	ruc: string;
	periodo: string;
	igvCompra: number;
	igvVenta: number;
	detraccionesPendientes: number;
	detraccionesMonto: number;
	pendingApprovals: number;
	facturasCompra: number;
	facturasVenta: number;
}

interface PendingRec {
	id: string;
	descripcion: string;
	monto: number;
	moneda: string;
	confianza: number;
	status: string;
}

export function AccountantDashboard() {
	const [summary, setSummary] = useState<SummaryData | null>(null);
	const [pendings, setPendings] = useState<PendingRec[]>([]);
	const [loading, setLoading] = useState(true);
	const [consultaQuery, setConsultaQuery] = useState("");
	const [consultaResult, setConsultaResult] = useState<string | null>(null);

	const loadData = async () => {
		try {
			const [sumRes, pendRes] = await Promise.all([
				fetch("/api/accountant/summary?ruc=20123456789&periodo=2026-07"),
				fetch("/api/approval/pending"),
			]);
			const sum = await sumRes.json();
			const pend = await pendRes.json();
			if (sum.ok) setSummary(sum.data);
			if (pend.ok) setPendings(pend.data.recommendations ?? []);
		} catch {
			// API not available yet — mock data
			setSummary({
				ruc: "20123456789",
				periodo: "2026-07",
				igvCompra: 18234.5,
				igvVenta: 9876.0,
				detraccionesPendientes: 3,
				detraccionesMonto: 1200.0,
				pendingApprovals: 2,
				facturasCompra: 45,
				facturasVenta: 12,
			});
			setPendings([
				{
					id: "REC-001",
					descripcion: "Contabilizar IGV",
					monto: 18234.5,
					moneda: "PEN",
					confianza: 0.92,
					status: "pending",
				},
				{
					id: "REC-002",
					descripcion: "Aplicar detracción",
					monto: 450,
					moneda: "PEN",
					confianza: 0.88,
					status: "pending",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const handleQuickConsulta = () => {
		setConsultaResult(`✅ Consulta enviada: "${consultaQuery}"`);
		setConsultaQuery("");
	};

	if (loading) {
		return (
			<div
				className="flex items-center justify-center h-64"
				style={{ color: "var(--text-secondary)" }}
			>
				Cargando panel contable...
			</div>
		);
	}

	return (
		<div
			className="flex-1 overflow-auto custom-scrollbar"
			style={{ backgroundColor: "var(--surface-1)" }}
		>
			<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					{/* Header */}
					<div className="flex items-center justify-between">
						<div>
							<h1
								className="text-2xl font-bold tracking-tight"
								style={{ color: "var(--text-primary)" }}
							>
								📊 Panel Contable
							</h1>
							<p
								className="mt-1 text-sm"
								style={{ color: "var(--text-secondary)" }}
							>
								Resumen fiscal — {summary?.periodo} | RUC {summary?.ruc}
							</p>
						</div>
					</div>

					{/* Summary Cards */}
					{summary && (
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<SummaryCard
								title="IGV Compra"
								value={`PEN ${summary.igvCompra.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
								icon="📥"
							/>
							<SummaryCard
								title="IGV Venta"
								value={`PEN ${summary.igvVenta.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`}
								icon="📤"
							/>
							<SummaryCard
								title="Detracciones"
								value={`${summary.detraccionesPendientes} por PEN ${summary.detraccionesMonto.toFixed(2)}`}
								icon="🔒"
							/>
							<SummaryCard
								title="Pendientes"
								value={`${summary.pendingApprovals} por aprobar`}
								icon="⏳"
								warning={summary.pendingApprovals > 0}
							/>
						</div>
					)}

					{/* Quick Consulta + Pending Approvals */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Quick Consulta */}
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
								🔍 Consulta Rápida
							</h2>
							<div className="flex gap-2">
								<input
									type="text"
									value={consultaQuery}
									onChange={(e) => setConsultaQuery(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleQuickConsulta()}
									placeholder='Ej: "IGV de julio 2026"'
									className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
									style={{
										borderColor: "var(--border)",
										backgroundColor: "var(--surface-1)",
										color: "var(--text-primary)",
									}}
								/>
								<button
									type="button"
									onClick={handleQuickConsulta}
									disabled={!consultaQuery.trim()}
									className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
									style={{ backgroundColor: "var(--accent)" }}
								>
									Ir
								</button>
							</div>
							{consultaResult && (
								<p
									className="mt-2 text-sm"
									style={{ color: "var(--success, #16a34a)" }}
								>
									{consultaResult}
								</p>
							)}
							<div className="mt-3 flex flex-wrap gap-1.5">
								{["IGV de julio", "detracciones", "último mes"].map((ex) => (
									<button
										key={ex}
										type="button"
										onClick={() => setConsultaQuery(ex)}
										className="text-xs rounded px-2 py-0.5"
										style={{
											backgroundColor: "var(--surface-3)",
											color: "var(--text-secondary)",
										}}
									>
										{ex}
									</button>
								))}
							</div>
						</div>

						{/* Pending Approvals Widget */}
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
								⏳ Pendientes por Aprobar
							</h2>
							{pendings.filter((r) => r.status === "pending").length === 0 ? (
								<p
									className="text-sm"
									style={{ color: "var(--text-secondary)" }}
								>
									No hay recomendaciones pendientes.
								</p>
							) : (
								<div className="space-y-2">
									{pendings
										.filter((r) => r.status === "pending")
										.map((rec) => (
											<div
												key={rec.id}
												className="rounded-lg p-3"
												style={{ backgroundColor: "var(--surface-3)" }}
											>
												<div className="flex items-center justify-between">
													<div>
														<span
															className="text-xs font-medium px-1.5 py-0.5 rounded"
															style={{
																backgroundColor: "var(--accent-bg, #dbeafe)",
																color: "var(--accent)",
															}}
														>
															{rec.id}
														</span>
														<span
															className="ml-2 text-sm font-medium"
															style={{ color: "var(--text-primary)" }}
														>
															{rec.descripcion}
														</span>
													</div>
													<span
														className="text-sm font-semibold"
														style={{ color: "var(--text-primary)" }}
													>
														{rec.moneda} {rec.monto.toFixed(2)}
													</span>
												</div>
												<div className="mt-1.5 flex items-center justify-between">
													<span
														className="text-xs"
														style={{ color: "var(--text-secondary)" }}
													>
														Confianza: {(rec.confianza * 100).toFixed(0)}%
													</span>
													<div className="flex gap-2">
														<button
															type="button"
															className="rounded px-3 py-1 text-xs font-medium text-white"
															style={{
																backgroundColor: "var(--success, #16a34a)",
															}}
														>
															Aprobar
														</button>
														<button
															type="button"
															className="rounded px-3 py-1 text-xs font-medium text-white"
															style={{
																backgroundColor: "var(--danger, #dc2626)",
															}}
														>
															Rechazar
														</button>
													</div>
												</div>
											</div>
										))}
								</div>
							)}
						</div>
					</div>

					{/* Stats Row */}
					{summary && (
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							<Stat
								label="Facturas Compra"
								value={String(summary.facturasCompra)}
							/>
							<Stat
								label="Facturas Venta"
								value={String(summary.facturasVenta)}
							/>
							<Stat
								label="Detracciones Pend."
								value={String(summary.detraccionesPendientes)}
							/>
							<Stat
								label="Aprobaciones Pend."
								value={String(summary.pendingApprovals)}
							/>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function SummaryCard({
	title,
	value,
	icon,
	warning,
}: {
	title: string;
	value: string;
	icon: string;
	warning?: boolean;
}) {
	return (
		<div
			className="rounded-xl border p-4 transition-all hover:shadow-sm"
			style={{
				borderColor: warning
					? "var(--warning-border, #fde68a)"
					: "var(--border)",
				backgroundColor: "var(--surface-2)",
			}}
		>
			<div className="flex items-center gap-2 mb-2">
				<span className="text-lg">{icon}</span>
				<span
					className="text-xs font-medium"
					style={{ color: "var(--text-secondary)" }}
				>
					{title}
				</span>
			</div>
			<div
				className="text-lg font-semibold"
				style={{ color: "var(--text-primary)" }}
			>
				{value}
			</div>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div
			className="rounded-lg p-3 text-center"
			style={{ backgroundColor: "var(--surface-2)" }}
		>
			<div className="text-xs" style={{ color: "var(--text-secondary)" }}>
				{label}
			</div>
			<div
				className="text-lg font-semibold mt-0.5"
				style={{ color: "var(--text-primary)" }}
			>
				{value}
			</div>
		</div>
	);
}
