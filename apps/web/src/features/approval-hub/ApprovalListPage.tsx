import { useEffect, useState } from "react";

interface RecItem {
	id: string;
	descripcion: string;
	monto: number;
	moneda: string;
	confianza: number;
	status: string;
	ruc: string;
	periodo: string;
	creado: string;
}

export function ApprovalListPage() {
	const [recs, setRecs] = useState<RecItem[]>([]);
	const [loading, setLoading] = useState(true);

	const loadApprovals = async () => {
		try {
			const res = await fetch("/api/approval/pending");
			const data = await res.json();
			if (data.ok) {
				setRecs(data.data.recommendations ?? []);
			}
		} catch {
			// Mock data
			setRecs([
				{
					id: "REC-001",
					descripcion: "Contabilizar IGV julio 2026",
					monto: 18234.5,
					moneda: "PEN",
					confianza: 0.92,
					status: "pending",
					ruc: "20123456789",
					periodo: "2026-07",
					creado: "2026-07-09T14:30:00Z",
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
					creado: "2026-07-09T13:00:00Z",
				},
				{
					id: "REC-003",
					descripcion: "Registrar retención proveedor",
					monto: 1200,
					moneda: "PEN",
					confianza: 0.95,
					status: "approved",
					ruc: "20123456789",
					periodo: "2026-07",
					creado: "2026-07-08T10:00:00Z",
				},
			]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadApprovals();
	}, []);

	const pending = recs.filter((r) => r.status === "pending");
	const approved = recs.filter((r) => r.status === "approved");
	const rejected = recs.filter((r) => r.status === "rejected");

	if (loading) {
		return (
			<div
				className="flex items-center justify-center h-64"
				style={{ color: "var(--text-secondary)" }}
			>
				Cargando recomendaciones...
			</div>
		);
	}

	return (
		<div
			className="flex-1 overflow-auto custom-scrollbar"
			style={{ backgroundColor: "var(--surface-1)" }}
		>
			<div className="mx-auto w-full max-w-[900px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					{/* Header */}
					<div>
						<h1
							className="text-2xl font-bold tracking-tight"
							style={{ color: "var(--text-primary)" }}
						>
							📋 Recomendaciones
						</h1>
						<p
							className="mt-1 text-sm"
							style={{ color: "var(--text-secondary)" }}
						>
							{pending.length} pendientes | {approved.length} aprobadas |{" "}
							{rejected.length} rechazadas
						</p>
					</div>

					{/* Pending */}
					{pending.length > 0 && (
						<section>
							<h2
								className="text-base font-semibold mb-3"
								style={{ color: "var(--text-primary)" }}
							>
								⏳ Pendientes ({pending.length})
							</h2>
							<div className="space-y-3">
								{pending.map((rec) => (
									<RecCard key={rec.id} rec={rec} showActions />
								))}
							</div>
						</section>
					)}

					{/* Approved */}
					{approved.length > 0 && (
						<section>
							<h2
								className="text-base font-semibold mb-3"
								style={{ color: "var(--text-primary)" }}
							>
								✅ Aprobadas ({approved.length})
							</h2>
							<div className="space-y-2">
								{approved.map((rec) => (
									<RecCard key={rec.id} rec={rec} />
								))}
							</div>
						</section>
					)}

					{/* Rejected */}
					{rejected.length > 0 && (
						<section>
							<h2
								className="text-base font-semibold mb-3"
								style={{ color: "var(--text-primary)" }}
							>
								❌ Rechazadas ({rejected.length})
							</h2>
							<div className="space-y-2">
								{rejected.map((rec) => (
									<RecCard key={rec.id} rec={rec} />
								))}
							</div>
						</section>
					)}

					{recs.length === 0 && (
						<div
							className="text-center py-12"
							style={{ color: "var(--text-secondary)" }}
						>
							No hay recomendaciones. Creá una consulta desde el dashboard.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function RecCard({
	rec,
	showActions,
}: {
	rec: RecItem;
	showActions?: boolean;
}) {
	const statusIcon =
		rec.status === "pending" ? "⏳" : rec.status === "approved" ? "✅" : "❌";

	return (
		<a
			href={`/approval/${rec.id}`}
			className="block rounded-xl border p-4 transition-all hover:shadow-sm"
			style={{
				borderColor: "var(--border)",
				backgroundColor: "var(--surface-2)",
			}}
			onClick={(e) => {
				e.preventDefault();
				window.history.pushState({}, "", `/approval/${rec.id}`);
				window.dispatchEvent(
					new CustomEvent("navigate", { detail: `/approval/${rec.id}` }),
				);
			}}
		>
			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-2">
					<span>{statusIcon}</span>
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
						className="text-sm font-medium"
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
			<div
				className="flex items-center justify-between text-xs"
				style={{ color: "var(--text-secondary)" }}
			>
				<div className="flex gap-4">
					<span>RUC: {rec.ruc}</span>
					<span>Período: {rec.periodo}</span>
					<span>Confianza: {(rec.confianza * 100).toFixed(0)}%</span>
				</div>
				{showActions && (
					<div className="flex gap-2">
						<button
							type="button"
							className="rounded px-3 py-1 text-xs font-medium text-white transition-all hover:opacity-90"
							style={{ backgroundColor: "var(--success, #16a34a)" }}
							onClick={async (e) => {
								e.preventDefault();
								e.stopPropagation();
								try {
									await fetch(`/api/approval/${rec.id}/approve`, {
										method: "POST",
									});
									window.location.reload();
								} catch {
									alert(
										"Error al aprobar. Asegurate que la API esté corriendo.",
									);
								}
							}}
						>
							Aprobar
						</button>
						<button
							type="button"
							className="rounded px-3 py-1 text-xs font-medium text-white transition-all hover:opacity-90"
							style={{ backgroundColor: "var(--danger, #dc2626)" }}
							onClick={async (e) => {
								e.preventDefault();
								e.stopPropagation();
								const motivo = prompt("Motivo del rechazo (obligatorio):");
								if (!motivo) return;
								try {
									await fetch(`/api/approval/${rec.id}/reject`, {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({ motivo }),
									});
									window.location.reload();
								} catch {
									alert("Error al rechazar.");
								}
							}}
						>
							Rechazar
						</button>
					</div>
				)}
			</div>
		</a>
	);
}
