import { useState } from "react";

interface EvidenceSource {
	tipo: string;
	serie: string;
	numero: number;
	monto: number;
	moneda: string;
	cdrHash?: string;
	fecha: string;
}

interface EvidenceRef {
	id: string;
	kind: string;
	phase: string;
	hash: string;
}

interface ConsultaResult {
	tipo: string;
	ruc: string;
	periodo: string;
	resultado: Record<string, unknown>;
	confianza: number;
	fuentes: EvidenceSource[];
	evidenceArtifacts?: EvidenceRef[];
	error?: string;
	sugerencia?: string;
}

export function ConsultaPage() {
	const [query, setQuery] = useState("");
	const [result, setResult] = useState<ConsultaResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const examples = [
		"IGV de julio 2026",
		"detracciones pendientes",
		"resumen SIRE del período",
		"analizame este período",
	];

	const handleSubmit = async () => {
		if (!query.trim()) return;
		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/consulta", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ texto: query, output: "json" }),
			});
			const data = await res.json();
			if (data.ok) {
				setResult(data.data);
			} else {
				setError(data.error ?? "Error en la consulta");
			}
		} catch {
			setError(
				"No se pudo conectar con el servidor. Asegurate que la API esté corriendo.",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="flex-1 overflow-auto custom-scrollbar"
			style={{ backgroundColor: "var(--surface-1)" }}
		>
			<div className="mx-auto w-full max-w-[800px] p-4 sm:p-6 lg:p-8">
				<div className="min-w-0 space-y-6">
					{/* Header */}
					<div>
						<h1
							className="text-2xl font-bold tracking-tight"
							style={{ color: "var(--text-primary)" }}
						>
							🔍 Consulta Fiscal
						</h1>
						<p
							className="mt-1 text-sm"
							style={{ color: "var(--text-secondary)" }}
						>
							Consultá datos fiscales usando lenguaje natural
						</p>
					</div>

					{/* Query Input */}
					<div
						className="rounded-xl border p-4"
						style={{
							borderColor: "var(--border)",
							backgroundColor: "var(--surface-2)",
						}}
					>
						<div className="flex gap-2">
							<input
								type="text"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
								placeholder='Ej: "IGV de julio 2026"'
								className="flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
								style={{
									borderColor: "var(--border)",
									backgroundColor: "var(--surface-1)",
									color: "var(--text-primary)",
								}}
							/>
							<button
								type="submit"
								onClick={handleSubmit}
								disabled={loading || !query.trim()}
								className="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50"
								style={{ backgroundColor: "var(--accent)" }}
							>
								{loading ? "Consultando..." : "Consultar"}
							</button>
						</div>

						{/* Examples */}
						<div className="mt-3 flex flex-wrap gap-2">
							{examples.map((ex) => (
								<button
									type="button"
									key={ex}
									onClick={() => {
										setQuery(ex);
									}}
									className="rounded-md px-3 py-1 text-xs transition-colors"
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

					{/* Error */}
					{error && (
						<div
							className="rounded-lg border p-4 text-sm"
							style={{
								borderColor: "var(--danger-border, #fca5a5)",
								backgroundColor: "var(--danger-bg, #fef2f2)",
								color: "var(--danger, #dc2626)",
							}}
						>
							⚠ {error}
						</div>
					)}

					{/* Result */}
					{result && !error && (
						<div
							className="rounded-xl border"
							style={{ borderColor: "var(--border)" }}
						>
							{/* Result Header */}
							<div
								className="border-b px-6 py-4"
								style={{ borderColor: "var(--border)" }}
							>
								<div className="flex items-center justify-between">
									<h2
										className="text-lg font-semibold"
										style={{ color: "var(--text-primary)" }}
									>
										📋 {getResultTitle(result)}
									</h2>
									<span
										className="text-xs font-medium px-2.5 py-0.5 rounded-full"
										style={{
											backgroundColor:
												result.confianza >= 0.7
													? "var(--success-bg, #dcfce7)"
													: "var(--warning-bg, #fef9c3)",
											color:
												result.confianza >= 0.7
													? "var(--success, #16a34a)"
													: "var(--warning, #ca8a04)",
										}}
									>
										{(result.confianza * 100).toFixed(0)}% confianza
									</span>
								</div>
								<div
									className="mt-1 text-xs"
									style={{ color: "var(--text-secondary)" }}
								>
									RUC: {result.ruc || "—"} | Período: {result.periodo || "—"}
								</div>
							</div>

							{/* Result Body */}
							<div className="p-6 space-y-4">
								{result.resultado && (
									<div className="grid grid-cols-2 gap-4">
										{Object.entries(result.resultado).map(([key, val]) => (
											<div
												key={key}
												className="rounded-lg p-3"
												style={{ backgroundColor: "var(--surface-2)" }}
											>
												<div
													className="text-xs"
													style={{ color: "var(--text-secondary)" }}
												>
													{key}
												</div>
												<div
													className="text-lg font-semibold mt-0.5"
													style={{ color: "var(--text-primary)" }}
												>
													{typeof val === "number"
														? `PEN ${val.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`
														: String(val)}
												</div>
											</div>
										))}
									</div>
								)}

								{/* Evidence Sources */}
								{result.fuentes && result.fuentes.length > 0 && (
									<div>
										<h3
											className="text-sm font-medium mb-2"
											style={{ color: "var(--text-primary)" }}
										>
											📎 Evidencia ({result.fuentes.length})
										</h3>
										<div className="space-y-1.5">
											{result.fuentes.slice(0, 5).map((f, i) => (
												<div
													key={i}
													className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
													style={{ backgroundColor: "var(--surface-2)" }}
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
													<span style={{ color: "var(--text-secondary)" }}>
														{f.fecha}
													</span>
												</div>
											))}
											{result.fuentes.length > 5 && (
												<p
													className="text-xs text-center"
													style={{ color: "var(--text-secondary)" }}
												>
													... y {result.fuentes.length - 5} más
												</p>
											)}
										</div>
									</div>
								)}

								{/* Evidence hash */}
								{result.evidenceArtifacts?.[0] && (
									<div
										className="text-xs"
										style={{ color: "var(--text-secondary)" }}
									>
										🔗 Hash: {result.evidenceArtifacts[0].hash.slice(0, 16)}...
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function getResultTitle(result: ConsultaResult): string {
	const titles: Record<string, string> = {
		"igv-consulta": `IGV estimado — ${result.periodo || "período"}`,
		"detracciones-consulta": `Detracciones — ${result.periodo || "período"}`,
		"sire-resumen": `Resumen SIRE — ${result.periodo || "período"}`,
		"retenciones-consulta": `Retenciones — ${result.periodo || "período"}`,
		"pipeline-run": `Pipeline ejecutado — ${result.periodo || "período"}`,
		"factura-lookup": "Documento encontrado",
		unknown: "Consulta no reconocida",
	};
	return titles[result.tipo] ?? "Resultado de consulta fiscal";
}
