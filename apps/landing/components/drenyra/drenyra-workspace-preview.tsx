"use client";

import type { ReactElement } from "react";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	FileText,
	Layers,
	TrendingUp,
	TrendingDown,
	Building2,
	Landmark,
	Activity,
	Database,
	Sparkles,
	Settings,
	Check,
	Lock,
	AlertCircle,
	Eye,
	RefreshCw,
	FileSignature
} from "lucide-react";
import { TYPOGRAPHY } from "@/lib/design-tokens";

// Definitive Design Constitution Color Layer Themes
const THEMES = {
	light: {
		name: "Arkelythex Light Institutional",
		desc: "Quiet Sovereign + Scientific Fiscal Architecture",
		styles: {
			"--bg-base": "#F7F4EE", // Pearl White
			"--bg-surface": "#EFE7DA", // Warm Ivory
			"--border-color": "#D8D6D0", // Fog Gray
			"--border-strong": "#3A3835", // Soft Graphite
			"--text-primary": "#181716", // Deep Charcoal
			"--text-secondary": "#3A3835", // Soft Graphite
			"--accent-color": "#B9824A", // Cognitive Copper
			"--diagnostic-blue": "#8FB9C7", // Diagnostic Blue
			"--accent-soft": "rgba(185, 130, 74, 0.08)",
			"--shadow-intensity": "rgba(24, 23, 22, 0.06)",
			"--orb-glow": "rgba(143, 185, 199, 0.3)",
			"--badge-bg": "#EFE7DA",
			"--badge-text": "#B9824A",
			"--success-color": "#527D65",
			"--risk-color": "#C95B50"
		}
	},
	warm: {
		name: "Drenyra Warm Product",
		desc: "Warm Cognitive Operational Interface",
		styles: {
			"--bg-base": "#F3E7D8", // Warm Cream
			"--bg-surface": "#ffffff", // Pure White or soft cream
			"--border-color": "#CAB6A2", // Cocoa Mist
			"--border-strong": "#C58C5A", // Soft Copper
			"--text-primary": "#19120C", // Ink Cocoa
			"--text-secondary": "#2A211B", // Brown Graphite
			"--accent-color": "#C58C5A", // Soft Copper
			"--accent-lucuma": "#F3B66B", // Lúcuma
			"--accent-soft": "rgba(197, 140, 90, 0.12)",
			"--shadow-intensity": "rgba(25, 18, 12, 0.1)",
			"--orb-glow": "rgba(243, 182, 107, 0.4)",
			"--badge-bg": "#F3E7D8",
			"--badge-text": "#C58C5A",
			"--success-color": "#4C845A",
			"--risk-color": "#D35A4F"
		}
	},
	oled: {
		name: "Command OLED",
		desc: "Cocoa OLED Fiscal Control Room (Power User Audit)",
		styles: {
			"--bg-base": "#090604", // OLED Cocoa Black
			"--bg-surface": "#19120C", // Deep Cocoa
			"--border-color": "#2A211B", // Brown Graphite
			"--border-strong": "#FBB974", // Copper Active
			"--text-primary": "#EEE0D5", // Warm Text
			"--text-secondary": "#CAB6A2", // Cocoa Mist
			"--accent-color": "#FBB974", // Copper Active
			"--accent-soft": "rgba(251, 185, 116, 0.12)",
			"--shadow-intensity": "rgba(0, 0, 0, 0.8)",
			"--orb-glow": "rgba(251, 185, 116, 0.4)",
			"--badge-bg": "#2A211B",
			"--badge-text": "#FBB974",
			"--success-color": "#9EC49F", // Sage Success
			"--risk-color": "#FFB4AB" // Red Risk
		}
	}
} as const;

// 6-Month Fiscal Scenarios (The Risk Heatline Data)
const SCENARIOS = {
	jan: {
		month: "Enero 2026",
		status: "green",
		score: 985,
		riskText: "Soberano",
		causes: [
			"Conciliación al 100% de 1,245 CPE",
			"Trazabilidad impecable en Libro Diario",
			"0 discrepancias detectadas por Vigila"
		],
		findings: "Operación en total cumplimiento",
		findingDetail: "Todos los CPE del periodo coinciden con los registros bancarios y la propuesta de SUNAT.",
		impact: "S/. 0.00",
		confidence: "100%",
		actionText: "Periodo auditado y archivado",
		actionStatus: "done",
		actionSeverity: "low",
		evidenceCount: 12
	},
	feb: {
		month: "Febrero 2026",
		status: "green",
		score: 970,
		riskText: "Estable",
		causes: [
			"Conciliación bancaria al 99.8%",
			"1 CPE de compra pendiente de cobro",
			"Evidencia digital encriptada y cerrada"
		],
		findings: "Operación estable",
		findingDetail: "Discrepancias menores inmateriales. 1 CPE pendiente de flujo bancario (vence en 14 días).",
		impact: "S/. 420.00",
		confidence: "99%",
		actionText: "Alinear flujo de caja",
		actionStatus: "ready",
		actionSeverity: "low",
		evidenceCount: 8
	},
	mar: {
		month: "Marzo 2026",
		status: "amber",
		score: 840,
		riskText: "Revisar",
		causes: [
			"1 diferencia de redondeo de IGV detectada",
			"2 comprobantes con RUC sin validación SPOT",
			"Conciliación bancaria al 96%"
		],
		findings: "Diferencia de redondeo impositivo",
		findingDetail: "Se detectó 1 CPE de compra con discrepancia de redondeo decimal de IGV frente a SUNAT.",
		impact: "S/. 12.80",
		confidence: "98%",
		actionText: "Preparar asiento de ajuste impositivo",
		actionStatus: "ready",
		actionSeverity: "medium",
		evidenceCount: 5
	},
	apr: {
		month: "Abril 2026",
		status: "red",
		score: 620,
		riskText: "Crítico",
		causes: [
			"3 inconsistencias graves detectadas por Vigila",
			"2 facturas de compra sin referencia en Registro",
			"Impacto de IGV desalineado en SIRE"
		],
		findings: "3 inconsistencias de IGV encontradas",
		findingDetail: "2 facturas de compra omiten referencia obligatoria al Registro de Compras (SIRE).",
		impact: "S/. 1,248.40",
		confidence: "91%",
		actionText: "Preparar flujo de corrección y SIRE",
		actionStatus: "needs_approval",
		actionSeverity: "high",
		evidenceCount: 6
	},
	may: {
		month: "Mayo 2026",
		status: "blue",
		score: 750,
		riskText: "Pendiente",
		causes: [
			"Pendiente de carga de 4 extractos bancarios",
			"5 movimientos sin match de conciliación",
			"Pre-auditoría de SIRE no inicializada"
		],
		findings: "Falta evidencia bancaria",
		findingDetail: "Drenyra requiere 4 extractos de cuenta del Banco de la Nación para cerrar conciliación de detracciones.",
		impact: "S/. 4,890.00",
		confidence: "84%",
		actionText: "Importar extractos del periodo",
		actionStatus: "ready",
		actionSeverity: "medium",
		evidenceCount: 3
	},
	jun: {
		month: "Junio 2026",
		status: "gray",
		score: 0,
		riskText: "Insuficiente data",
		causes: [
			"Periodo fiscal abierto",
			"Solo 14 CPE emitidos a la fecha",
			"Sin conciliación bancaria programada"
		],
		findings: "Fase de recolección de datos",
		findingDetail: "El periodo fiscal sigue abierto. Esperando sincronización periódica nocturna.",
		impact: "N/A",
		confidence: "N/A",
		actionText: "Sincronizar SUNAT manual",
		actionStatus: "ready",
		actionSeverity: "low",
		evidenceCount: 1
	}
} as const;

export function DrenyraWorkspacePreview(): ReactElement {
	// Interactive States
	const [activeTheme, setActiveTheme] = useState<"light" | "warm" | "oled">("warm");
	const [activeMonth, setActiveMonth] = useState<keyof typeof SCENARIOS>("apr");
	const [activeDocIndex, setActiveDocIndex] = useState(0);
	const [approvedMonths, setApprovedMonths] = useState<Record<string, boolean>>({
		jan: true,
		feb: true
	});
	const [auditLensActive, setAuditLensActive] = useState(false);
	const [showSunatPreview, setShowSunatPreview] = useState(false);
	const [agentThinkingText, setAgentThinkingText] = useState("Observing documents...");

	const activeScenario = SCENARIOS[activeMonth];
	const isCurrentApproved = !!approvedMonths[activeMonth];
	const modalRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	// ESC key handler + focus management for modal
	useEffect(() => {
		if (!showSunatPreview) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setShowSunatPreview(false);
		};
		// Focus the modal on open
		modalRef.current?.focus();
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [showSunatPreview]);

	// Simulated Documents inside the Evidence Stack
	const documents = useMemo(() => {
		return [
			{
				id: "CPE E001-8422",
				type: "Factura Electrónica",
				ruc: "20608492015",
				company: "Inversiones Drenyra S.A.C.",
				base: 6935.56,
				igv: 1248.40,
				total: 8183.96,
				rule: "SUNAT UBL 2.1 Schema validation & SPOT Detracción check",
				timestamp: "2026-05-28 21:23:45",
				responsible: "Drenyra Agent",
				proposedChange: "Vincular a partida bancaria #10425 (Continental S/. 8,183.96)",
				hash: "sha256:d8a7c6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5"
			},
			{
				id: "CPE F003-10492",
				type: "Boleta Electrónica",
				ruc: "20100452391",
				company: "Proveedor Técnico Perú",
				base: 450.00,
				igv: 81.00,
				total: 531.00,
				rule: "IGV Cálculo Exacto (18%)",
				timestamp: "2026-05-28 18:40:12",
				responsible: "Eviden Subagent",
				proposedChange: "Establecer match automático por ID tributario",
				hash: "sha256:f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5d8a7c6"
			},
			{
				id: "BANCO N-40291",
				type: "Detracción SPOT",
				ruc: "20549201032",
				company: "SUNAT Detracciones",
				base: 1200.00,
				igv: 0.00,
				total: 1200.00,
				rule: "SPOT Depósito de Detracciones (12% Servicios)",
				timestamp: "2026-05-27 10:15:33",
				responsible: "Regula Subagent",
				proposedChange: "Validar constancia de depósito SUNAT",
				hash: "sha256:a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5d8a7c6f5e4d3c2b1"
			}
		];
	}, []);

	// Rotate document stack when clicked
	const rotateStack = () => {
		setActiveDocIndex((prev) => (prev + 1) % documents.length);
	};

	// Simulated Agent Thinking lifecycle animation
	useEffect(() => {
		const steps = [
			"Observing documents...",
			"Matching bank movements...",
			"Checking SUNAT rules...",
			"Building evidence stack...",
			"Preparing correction..."
		];
		let stepIdx = 0;
		const interval = setInterval(() => {
			stepIdx = (stepIdx + 1) % steps.length;
			setAgentThinkingText(steps[stepIdx]);
		}, 3000);
		return () => clearInterval(interval);
	}, []);

	// Handles approving a month (Approval Lock / Sealed Evidence transition)
	const handleApprove = () => {
		setApprovedMonths((prev) => ({
			...prev,
			[activeMonth]: true
		}));
	};

	return (
		<div
			style={THEMES[activeTheme].styles as React.CSSProperties}
			aria-label="Vista previa del workspace de Drenyra — demostración interactiva del panel de control fiscal"
			role="region"
			className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-primary)] shadow-2xl transition-all duration-500 overflow-hidden font-sans select-none"
		>
			{/* Live region for screen reader announcements */}
			<div className="sr-only" role="status" aria-live="polite">
				{`Documento activo: ${documents[activeDocIndex]?.company ?? ""}. ${agentThinkingText}`}
			</div>
			{/* macOS Chrome Header with Dynamic Theme Control */}
			<header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-3 gap-3 transition-colors duration-500">
				{/* OS Windows controls & Title */}
				<div className="flex items-center gap-3">
					<div className="flex gap-1.5" aria-hidden>
						<span className="h-3.5 w-3.5 rounded-full bg-[#FF5F56] opacity-90 transition-opacity hover:opacity-100 cursor-pointer" />
						<span className="h-3.5 w-3.5 rounded-full bg-[#FFBD2E] opacity-90 transition-opacity hover:opacity-100 cursor-pointer" />
						<span className="h-3.5 w-3.5 rounded-full bg-[#27C93F] opacity-90 transition-opacity hover:opacity-100 cursor-pointer" />
					</div>
					<div className="flex items-center gap-2 ml-2">
						<div className="relative flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent-color)] text-white font-serif text-xs font-bold transition-all duration-500">
							A
							<span className="absolute inset-0 rounded-md bg-white/10 motion-safe:animate-ping" style={{ animationDuration: "3s" }} />
						</div>
						<span className="font-mono text-xs uppercase tracking-widest font-bold">
							Arkelythex / Drenyra
						</span>
					</div>
					<span
						className="hidden sm:inline-block rounded-full bg-[var(--accent-soft)] border border-[var(--accent-color)]/20 px-2.5 py-0.5 font-mono tracking-wider font-bold text-[var(--accent-color)] uppercase"
						style={{ fontSize: TYPOGRAPHY.xs }}
					>
						Active Workspace
					</span>
				</div>

				{/* Layer Switcher - The 3 Visual Layers from the Design Constitution */}
				<div className="flex items-center gap-1.5 bg-[var(--bg-base)] border border-[var(--border-color)] p-1 rounded-lg self-end sm:self-auto transition-colors duration-500">
					<button
						type="button"
						onClick={() => setActiveTheme("light")}
						aria-pressed={activeTheme === "light"}
						className={`rounded px-2 py-1 font-bold tracking-wider uppercase transition-all duration-300 ${
							activeTheme === "light"
								? "bg-[var(--accent-color)] text-[var(--bg-base)] shadow-sm"
								: "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
						}`}
						style={{ fontSize: TYPOGRAPHY["2xs"] }}
						title="Identity pública - Perla / Grafito"
					>
						🏛️ Institucional
					</button>
					<button
						type="button"
						onClick={() => setActiveTheme("warm")}
						aria-pressed={activeTheme === "warm"}
						className={`rounded px-2 py-1 font-bold tracking-wider uppercase transition-all duration-300 ${
							activeTheme === "warm"
								? "bg-[var(--accent-color)] text-[var(--bg-base)] shadow-sm"
								: "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
						}`}
						style={{ fontSize: TYPOGRAPHY["2xs"] }}
						title="Capa de Producto - Cálido / Crema"
					>
						🌿 Producto
					</button>
					<button
						type="button"
						onClick={() => setActiveTheme("oled")}
						aria-pressed={activeTheme === "oled"}
						className={`rounded px-2 py-1 font-bold tracking-wider uppercase transition-all duration-300 ${
							activeTheme === "oled"
								? "bg-[var(--accent-color)] text-[var(--bg-base)] shadow-sm"
								: "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
						}`}
						style={{ fontSize: TYPOGRAPHY["2xs"] }}
						title="Modo Power User - OLED / Sage"
					>
						⚡ OLED
					</button>
				</div>
			</header>

			{/* Sub-Header: Active Company Info and Risk Heatline */}
			<div className="flex flex-col md:flex-row items-stretch justify-between border-b border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-3 gap-4 transition-colors duration-500">
				{/* Active RUC Scoping Info */}
				<div className="flex items-center gap-3">
					<div>
						<p
							className="font-mono uppercase tracking-wider text-[var(--text-secondary)]"
							style={{ fontSize: TYPOGRAPHY.xs }}
						>
							Empresa Activa (RUC Scoped)
						</p>
						<h3 className="text-sm font-black tracking-tight flex items-center gap-1.5 mt-0.5">
							{documents[0].company}
							<span className="font-mono text-xs text-[var(--accent-color)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded border border-[var(--accent-color)]/25">
								{documents[0].ruc}
							</span>
						</h3>
					</div>
				</div>

				{/* Insignia 7: Risk Heatline - Semantic Period Risks */}
				<div className="flex flex-col gap-1">
					<p
						className="font-mono uppercase tracking-widest text-[var(--text-secondary)] md:text-right"
						style={{ fontSize: TYPOGRAPHY.xs }}
					>
						Línea Semántica de Riesgo (Risk Heatline)
					</p>
					<div className="flex items-center gap-1 bg-[var(--bg-base)] border border-[var(--border-color)] p-0.5 rounded-lg transition-colors duration-500">
						{(Object.keys(SCENARIOS) as Array<keyof typeof SCENARIOS>).map((key) => {
							const item = SCENARIOS[key];
							const isSelected = activeMonth === key;
							let dotColor = "bg-gray-400";
							
							if (item.status === "green") {
								dotColor = "bg-[var(--success-color)]";
							} else if (item.status === "amber") {
								dotColor = "bg-amber-500";
							} else if (item.status === "red") {
								dotColor = "bg-[var(--risk-color)]";
							} else if (item.status === "blue") {
								dotColor = "bg-[var(--diagnostic-blue)]";
							}

							return (
								<button
									key={key}
									type="button"
									onClick={() => {
										setActiveMonth(key);
									}}
									aria-pressed={isSelected}
									aria-label={`${item.month} — Riesgo ${item.riskText}, Score ${item.score}`}
									className={`flex items-center gap-1.5 px-2 py-1 rounded font-mono tracking-tight transition-all ${
										isSelected
											? "bg-[var(--bg-surface)] font-black border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm"
											: "text-[var(--text-secondary)] opacity-60 hover:opacity-100"
									}`}
									style={{ fontSize: TYPOGRAPHY["2xs"] }}
								>
									<span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
									<span className="uppercase">{key}</span>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Main Three-Zone Layout of Cognitive Fiscal Architecture */}
			<div className="grid grid-cols-1 md:grid-cols-[160px_1fr] lg:grid-cols-[180px_1fr_280px] min-h-[520px] transition-colors duration-500">
				
				{/* ZONE 1: Navigation Spine (Columna Vertebral Izquierda) */}
				<nav className="border-r border-[var(--border-color)] bg-[var(--bg-surface)] p-3 flex flex-col justify-between transition-colors duration-500">
					<ul className="space-y-1">
						<li
							className="font-mono uppercase tracking-widest text-[var(--text-secondary)] px-2.5 py-1 mb-2"
							style={{ fontSize: TYPOGRAPHY.xs }}
						>
							Spine Navigation
						</li>
						{[
							{ label: "Overview", icon: Layers, count: null },
							{ label: "Documents", icon: FileText, count: documents.length.toString() },
							{ label: "Sales", icon: TrendingUp, count: null },
							{ label: "Purchases", icon: TrendingDown, count: null },
							{ label: "SIRE", icon: Building2, count: "Sync", active: true },
							{ label: "Banking", icon: Landmark, count: null },
							{ label: "Reconciliation", icon: RefreshCw, count: null },
							{ label: "Fiscal Health", icon: Activity, count: activeScenario.score > 0 ? activeScenario.score.toString() : "N/A" },
							{ label: "Evidence", icon: Database, count: activeScenario.evidenceCount.toString() },
							{ label: "Agents", icon: Sparkles, count: "8" },
							{ label: "Settings", icon: Settings, count: null }
						].map((item) => {
							const Icon = item.icon;
							return (
								<li key={item.label}>
									<button
										type="button"
										className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 rounded-md font-medium transition-all ${
											item.active
												? "bg-[var(--accent-color)] text-[var(--bg-base)] font-bold"
												: "text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]"
										}`}
										style={{ fontSize: TYPOGRAPHY.label }}
									>
										<span className="flex items-center gap-2">
											<Icon className="h-3.5 w-3.5" />
											<span>{item.label}</span>
										</span>
										{item.count && (
											<span
												className={`font-mono px-1 py-0.2 rounded border ${
													item.active
														? "border-[var(--bg-base)]/40 bg-[var(--bg-base)]/10 text-[var(--bg-base)]"
														: "border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-secondary)]"
												}`}
												style={{ fontSize: TYPOGRAPHY.xs }}
											>
												{item.count}
											</span>
										)}
									</button>
								</li>
							);
						})}
					</ul>

					{/* Scoped subagents list */}
					<div className="mt-6 border-t border-[var(--border-color)] pt-3 px-2">
						<p
							className="font-mono uppercase tracking-widest text-[var(--text-secondary)] mb-2"
							style={{ fontSize: TYPOGRAPHY.xs }}
						>
							Subagentes
						</p>
						<div className="space-y-1.5">
							{["Eviden", "Vigila", "Traza", "Regula"].map((agent) => (
								<div
									key={agent}
									className="flex items-center gap-1.5 font-mono text-[var(--text-secondary)]"
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									<span className="h-1 w-1 rounded-full bg-[var(--success-color)] motion-safe:animate-ping" />
									<span>{agent} node</span>
								</div>
							))}
						</div>
					</div>
				</nav>

				{/* ZONE 2: Evidence Workspace (Centro) */}
				<main className="relative flex flex-col p-4 md:p-5 overflow-hidden bg-[var(--bg-base)] min-w-0 transition-colors duration-500">
					
					{/* The Evidence Lattice sutil grid pattern */}
					<div className="absolute inset-0 pointer-events-none opacity-20 transition-opacity" aria-hidden>
						{auditLensActive ? (
							// Visual blueprint lines when Audit Lens is activated
							<svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
								<defs>
									<pattern id="audit-grid" width="40" height="40" patternUnits="userSpaceOnUse">
										<path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--accent-color)" strokeWidth="0.5" opacity="0.2" />
									</pattern>
								</defs>
								<rect width="100%" height="100%" fill="url(#audit-grid)" />
								
								{/* Glowing node connector paths (Drenyra Flow) */}
								<path d="M 120 180 Q 240 100 360 220" fill="none" stroke="var(--accent-color)" strokeWidth="1.5" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
								<path d="M 280 250 T 420 380" fill="none" stroke="var(--diagnostic-blue)" strokeWidth="1" strokeDasharray="3 3" />
								
								<circle cx="120" cy="180" r="4" fill="var(--risk-color)" />
								<circle cx="360" cy="220" r="5" fill="var(--accent-color)" className="motion-safe:animate-ping" style={{ animationDuration: "2s" }} />
								<circle cx="420" cy="380" r="4" fill="var(--success-color)" />
							</svg>
						) : (
							// Soft lattice dots normally
							<div
								className="w-full h-full"
								style={{
									backgroundImage: "radial-gradient(var(--border-strong) 1px, transparent 1px)",
									backgroundSize: "24px 24px",
									opacity: 0.15
								}}
							/>
						)}
					</div>

					<div className="relative z-10 flex flex-col gap-4 flex-1">
						
						{/* Top Section: Health Orb and Quick Indicators */}
						<div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-4 items-stretch">
							
							{/* Component 1: Fiscal Health Orb */}
							<div className="relative rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3.5 flex flex-col items-center justify-center text-center shadow-sm overflow-hidden transition-colors duration-500 group">
								<div className="absolute inset-0 bg-radial-gradient from-[var(--orb-glow)] via-transparent to-transparent opacity-20 group-hover:opacity-40 transition-opacity" />
								
								{activeScenario.score > 0 ? (
									<>
										{/* Elegant SVG Orb Ring */}
										<div className="relative h-20 w-20 flex items-center justify-center">
											<svg className="absolute inset-0 w-full h-full transform -rotate-90">
												<circle
													cx="40"
													cy="40"
													r="34"
													className="stroke-[var(--border-color)] fill-none stroke-[3.5]"
												/>
												<circle
													cx="40"
													cy="40"
													r="34"
													className="fill-none stroke-[3.5] transition-all duration-1000 ease-out"
													style={{
														stroke: activeScenario.status === "red"
															? "var(--risk-color)"
															: activeScenario.status === "amber"
																? "#F59E0B"
																: "var(--success-color)",
														strokeDasharray: "213.62",
														strokeDashoffset: 213.62 - (213.62 * activeScenario.score) / 1000
													}}
												/>
											</svg>
											<div className="flex flex-col items-center leading-none">
												<span className="font-mono text-xl font-black tracking-tight">{activeScenario.score}</span>
												<span
													className="font-mono text-[var(--text-secondary)] uppercase mt-0.5 tracking-wider"
													style={{ fontSize: TYPOGRAPHY.xs }}
												>
													Score
												</span>
											</div>
										</div>
										<p
											className={`mt-2 font-mono font-bold uppercase tracking-wider ${
												activeScenario.status === "red"
													? "text-[var(--risk-color)]"
													: activeScenario.status === "amber"
														? "text-amber-500"
														: "text-[var(--success-color)]"
											}`}
											style={{ fontSize: TYPOGRAPHY["2xs"] }}
										>
											{activeScenario.riskText}
										</p>
									</>
								) : (
									<div className="h-20 w-20 rounded-full border border-dashed border-[var(--border-color)] flex items-center justify-center">
										<span className="font-mono text-sm text-[var(--text-secondary)]">N/A</span>
									</div>
								)}
							</div>

							{/* Scoped monthly summary & causes details */}
							<div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between shadow-sm transition-colors duration-500">
								<div>
									<div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-2">
										<h4
											className="font-black uppercase tracking-wider flex items-center gap-1.5"
											style={{ fontSize: TYPOGRAPHY.xs }}
										>
											<span className="h-2 w-2 rounded-full bg-[var(--accent-color)]" />
											Diagnóstico de {activeScenario.month}
										</h4>
										<span
											className="font-mono text-[var(--text-secondary)]"
											style={{ fontSize: TYPOGRAPHY.xs }}
										>
											TraceID: {activeMonth}-gate-942
										</span>
									</div>
									<ul className="space-y-1">
										{activeScenario.causes.map((c) => (
											<li
												key={c}
												className="text-[var(--text-secondary)] flex items-start gap-1.5"
												style={{ fontSize: TYPOGRAPHY["2xs"] }}
											>
												<span className="text-[var(--accent-color)] mt-0.5">•</span>
												<span>{c}</span>
											</li>
										))}
									</ul>
								</div>
								
								<div
									className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-color)]/50 pt-2 font-mono text-[var(--text-secondary)]"
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									<span>Confianza de Sistema: {activeScenario.confidence}</span>
									<span className="flex items-center gap-1 text-[var(--accent-color)]">
										<Lock className="h-2.5 w-2.5" />
										ISO 27001 Scoped
									</span>
								</div>
							</div>
						</div>

						{/* Center-Bottom Layout: Left Evidence Stack, Right Timeline */}
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch flex-1">
							
							{/* Evidence Stack Column */}
							<div className="lg:col-span-7 flex flex-col gap-3 min-h-[220px]">
								<div className="flex items-center justify-between">
									<h4
										className="font-black uppercase tracking-wider flex items-center gap-2"
										style={{ fontSize: TYPOGRAPHY.xs }}
									>
										<Database className="h-3.5 w-3.5 text-[var(--accent-color)]" />
										Evidence Stack (CPE / Banco)
									</h4>
									<button
										type="button"
										onClick={rotateStack}
										className="font-mono uppercase tracking-wider text-[var(--accent-color)] hover:underline flex items-center gap-1"
										style={{ fontSize: TYPOGRAPHY.xs }}
									>
										<RefreshCw className="h-2.5 w-2.5" />
										Rotar pila
									</button>
								</div>

								{/* Component 2: Evidence Stack - Clickable layered card deck */}
								<div className="relative flex-1 min-h-[180px] w-full flex items-center justify-center p-2">
									{documents.map((doc, idx) => {
										// Stack position formula
										const relativeIdx = (idx - activeDocIndex + documents.length) % documents.length;
										const isFront = relativeIdx === 0;

										// Absolute stacking offset
										const offsetZ = documents.length - relativeIdx;
										const offsetY = relativeIdx * 10;
										const scale = 1 - relativeIdx * 0.05;

										return (
											<motion.div
												key={doc.id}
												onClick={rotateStack}
												className={`absolute w-full max-w-[340px] rounded-xl border p-4 cursor-pointer shadow-md select-none transition-all duration-300 ${
													isFront
														? "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
														: "border-[var(--border-color)] bg-[var(--bg-surface)]/70 text-[var(--text-secondary)] opacity-80"
												}`}
												style={{
													zIndex: offsetZ,
													transform: `translateY(${offsetY}px) scale(${scale})`,
													transformOrigin: "bottom center"
												}}
												layout
											>
												{/* Header with Type and Sealed status */}
												<div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2 mb-2.5">
													<div>
														<span
															className="font-mono uppercase tracking-wider text-[var(--accent-color)]"
															style={{ fontSize: TYPOGRAPHY.xs }}
														>
															{doc.type}
														</span>
														<h5 className="font-mono text-xs font-bold mt-0.5">{doc.id}</h5>
													</div>
													{isCurrentApproved && (
														// SEALED badge (Approval Lock motion design)
														<span
															className="flex items-center gap-1 rounded bg-[var(--success-color)]/10 border border-[var(--success-color)]/30 px-1.5 py-0.5 font-mono font-bold uppercase tracking-widest text-[var(--success-color)] animate-[pulse_2s_infinite]"
															style={{ fontSize: TYPOGRAPHY.xs }}
														>
															<Lock className="h-2 w-2" /> SEALED
														</span>
													)}
												</div>

												{/* CPE pricing details with exact Mono typography */}
												<div className="grid grid-cols-3 gap-2 border-b border-[var(--border-color)] pb-2.5 mb-2.5">
													<div>
														<p
															className="font-mono text-[var(--text-secondary)] uppercase"
															style={{ fontSize: TYPOGRAPHY.xs }}
														>
															Base Imp.
														</p>
														<p className="font-mono text-xs font-black">S/. {doc.base.toFixed(2)}</p>
													</div>
													<div>
														<p
															className="font-mono text-[var(--text-secondary)] uppercase"
															style={{ fontSize: TYPOGRAPHY.xs }}
														>
															IGV 18%
														</p>
														<p className="font-mono text-xs font-black">S/. {doc.igv.toFixed(2)}</p>
													</div>
													<div>
														<p
															className="font-mono text-[var(--text-secondary)] uppercase"
															style={{ fontSize: TYPOGRAPHY.xs }}
														>
															Total
														</p>
														<p className="font-mono text-xs font-black">S/. {doc.total.toFixed(2)}</p>
													</div>
												</div>

												{/* Technical metadata */}
												<div
													className="space-y-1.5 font-mono"
													style={{ fontSize: TYPOGRAPHY.xs }}
												>
													<p className="truncate">
														<span className="text-[var(--text-secondary)]">Rule:</span> {doc.rule}
													</p>
													<p className="truncate">
														<span className="text-[var(--text-secondary)]">Change:</span> <span className="text-[var(--accent-color)]">{doc.proposedChange}</span>
													</p>
													{auditLensActive && (
														<p
															className="text-[var(--accent-color)] border-t border-[var(--border-color)]/50 pt-1.5 font-mono break-all leading-none"
															style={{ fontSize: TYPOGRAPHY.xs }}
														>
															<span className="font-bold">EVIDENCE HASH:</span> {doc.hash}
														</p>
													)}
												</div>
											</motion.div>
										);
									})}
								</div>
							</div>

							{/* Reconciliation Timeline Column */}
							<div className="lg:col-span-5 flex flex-col gap-3">
								<h4
									className="font-black uppercase tracking-wider flex items-center gap-2"
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									<Activity className="h-3.5 w-3.5 text-[var(--accent-color)]" />
									Reconciliation Timeline
								</h4>
								
								{/* Component 5: Reconciliation Timeline */}
								<div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3.5 flex-1 flex flex-col justify-between shadow-sm transition-colors duration-500">
									<div className="space-y-3.5">
										{[
											{ label: "Factura Emitida", desc: "CPE E001-8422 validado", color: "bg-[var(--accent-color)]" },
											{ label: "Pago Recibido", desc: "Banco Continental S/. 8,183.96", color: "bg-[var(--success-color)]" },
											{ label: "Banco Conciliado", desc: "Drenyra Match 100% exacto", color: "bg-[var(--diagnostic-blue)]" },
											{ label: "Asiento Generado", desc: "Libro Diario, Registro #104", color: "bg-amber-500" },
											{ label: "SIRE Preparado", desc: "Expediente digital listo", color: "bg-gray-400" }
										].map((item, idx) => (
											<div key={item.label} className="relative flex gap-3 items-start group">
												{idx < 4 && (
													<span className="absolute left-[7px] top-[14px] bottom-[-22px] w-[1px] bg-[var(--border-color)] transition-colors" />
												)}
												<span className={`h-3.5 w-3.5 rounded-full shrink-0 mt-0.5 border-2 border-[var(--bg-surface)] z-10 ${item.color}`} />
												<div className="min-w-0">
													<p
														className="font-black leading-none"
														style={{ fontSize: TYPOGRAPHY["2xs"] }}
													>
														{item.label}
													</p>
													<p
														className="font-mono text-[var(--text-secondary)] mt-0.5"
														style={{ fontSize: TYPOGRAPHY.xs }}
													>
														{item.desc}
													</p>
												</div>
											</div>
										))}
									</div>

									{/* Quick Shadow SUNAT toggle trigger */}
									<button
										type="button"
										onClick={() => setShowSunatPreview(true)}
										className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-base)] py-2 font-bold tracking-wider uppercase transition-colors hover:bg-[var(--accent-soft)]"
										style={{ fontSize: TYPOGRAPHY["2xs"] }}
									>
										<Eye className="h-3 w-3" />
										Shadow SUNAT Preview
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Workspace Footer Status Bar with Audit Trail Toggle */}
					<footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border-color)] pt-3.5 mt-4 gap-3">
						<div className="flex items-center gap-2">
							<span className="h-2 w-2 rounded-full bg-[var(--success-color)] animate-pulse" />
							<span
								className="font-mono text-[var(--text-secondary)]"
								style={{ fontSize: TYPOGRAPHY.xs }}
							>
								Drenyra Cognitive Interface · RUC: 20608492015
							</span>
						</div>

						<div className="flex items-center gap-2">
							{/* Component 6: Audit Trail Lens - Toggle button */}
							<button
								type="button"
								onClick={() => setAuditLensActive(!auditLensActive)}
								className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono uppercase tracking-wider transition-all border ${
									auditLensActive
										? "bg-[var(--accent-color)] text-[var(--bg-base)] border-[var(--border-strong)] font-black"
										: "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]"
								}`}
								style={{ fontSize: TYPOGRAPHY.xs }}
							>
								<Eye className="h-3.5 w-3.5" />
								{auditLensActive ? "Trazabilidad Activa" : "Activar Trazabilidad (Audit)"}
							</button>
						</div>
					</footer>
				</main>

				{/* ZONE 3: Drenyra Intelligence Rail (Panel Derecho) */}
				<aside className="border-t md:border-t-0 md:border-l lg:border-l border-[var(--border-color)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between transition-colors duration-500">
					<div>
						{/* Active Node status */}
						<div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3.5 mb-4">
							<div className="flex items-center gap-2">
								<div className="relative h-4 w-4">
									<span className="absolute inset-0 rounded-full bg-[var(--accent-color)] opacity-20 motion-safe:animate-ping" />
									<Sparkles className="h-4 w-4 text-[var(--accent-color)]" />
								</div>
								<h4 className="text-xs font-black uppercase tracking-widest leading-none">
									Drenyra Node
								</h4>
							</div>
							<span
								className="rounded bg-[var(--success-color)]/10 border border-[var(--success-color)]/25 px-1.5 py-0.5 font-mono font-bold text-[var(--success-color)]"
								style={{ fontSize: TYPOGRAPHY.xs }}
							>
								ACTIVE
							</span>
						</div>

						{/* Component 5: Drenyra Cognitive States (Observing/Matching...) */}
						<div
							className="bg-[var(--bg-base)] border border-[var(--border-color)]/50 rounded-lg p-2.5 mb-4 flex items-center gap-2.5 font-mono text-[var(--text-secondary)] transition-colors duration-500"
							style={{ fontSize: TYPOGRAPHY["2xs"] }}
						>
							<RefreshCw className="h-3.5 w-3.5 animate-spin text-[var(--accent-color)]" style={{ animationDuration: "5s" }} />
							<span className="text-balance leading-tight">{agentThinkingText}</span>
						</div>

						{/* Component 4: Drenyra Action Card */}
						<div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] p-4 shadow-sm space-y-4 transition-colors duration-500">
							{/* Badge Severity */}
							<div className="flex items-center justify-between">
								<span
									className="font-mono uppercase tracking-wider text-[var(--text-secondary)]"
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									Severidad
								</span>
								<span
									className={`rounded font-mono font-bold uppercase tracking-wider px-2 py-0.5 border ${
										activeScenario.status === "red"
											? "bg-[var(--risk-color)]/10 border-[var(--risk-color)]/30 text-[var(--risk-color)]"
											: activeScenario.status === "amber"
												? "bg-amber-500/10 border-amber-500/30 text-amber-500"
												: "bg-[var(--success-color)]/10 border-[var(--success-color)]/30 text-[var(--success-color)]"
									}`}
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									{activeScenario.riskText}
								</span>
							</div>

							{/* Cognitive Findings */}
							<div className="space-y-1.5">
								<p
									className="font-mono text-[var(--text-secondary)] uppercase"
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									Drenyra Halló:
								</p>
								<p className="text-xs font-black leading-snug">{activeScenario.findings}</p>
								<p
									className="text-[var(--text-secondary)] leading-relaxed"
									style={{ fontSize: TYPOGRAPHY["2xs"] }}
								>
									{activeScenario.findingDetail}
								</p>
							</div>

							{/* Financial Impact breakdown */}
							<div className="grid grid-cols-2 gap-2 border-y border-[var(--border-color)] py-2.5">
								<div>
									<p
										className="font-mono text-[var(--text-secondary)] uppercase"
										style={{ fontSize: TYPOGRAPHY.xs }}
									>
										Impacto Estimado
									</p>
									<p className="font-mono text-xs font-black text-[var(--accent-color)] mt-0.5">
										{activeScenario.impact}
									</p>
								</div>
								<div>
									<p
										className="font-mono text-[var(--text-secondary)] uppercase"
										style={{ fontSize: TYPOGRAPHY.xs }}
									>
										Confianza
									</p>
									<p className="font-mono text-xs font-black text-[var(--text-primary)] mt-0.5">
										{activeScenario.confidence}
									</p>
								</div>
							</div>

							{/* AI Actions with Human Gate triggers */}
							<div className="space-y-2">
								<p
									className="font-mono text-[var(--text-secondary)] uppercase"
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									Acción Sugerida:
								</p>
								<p
									className="font-black leading-tight text-[var(--text-primary)]"
									style={{ fontSize: TYPOGRAPHY.xs }}
								>
									{activeScenario.actionText}
								</p>
								
								{activeScenario.actionStatus === "needs_approval" ? (
									<div className="flex flex-col gap-1.5 pt-2">
										{isCurrentApproved ? (
											<div
												className="w-full flex items-center justify-center gap-1.5 bg-[var(--success-color)]/10 border border-[var(--success-color)]/30 text-[var(--success-color)] py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all duration-500"
												style={{ fontSize: TYPOGRAPHY["2xs"] }}
											>
												<Check className="h-3 w-3" />
												Seal Evidencia Aprobado
											</div>
										) : (
											<button
												type="button"
												onClick={handleApprove}
												className="w-full flex items-center justify-center gap-1.5 bg-[var(--accent-color)] hover:opacity-95 text-[var(--bg-base)] py-2.5 rounded-lg font-black uppercase tracking-widest transition-all shadow-sm active:translate-y-0.5"
												style={{ fontSize: TYPOGRAPHY["2xs"] }}
											>
												<FileSignature className="h-3.5 w-3.5" />
												Aprobar y Sellar
											</button>
										)}
										<button
											type="button"
											className="w-full border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2 rounded-lg font-bold uppercase tracking-wider transition-colors"
											style={{ fontSize: TYPOGRAPHY.xs }}
										>
											Revisar
										</button>
									</div>
								) : (
									<div
										className="w-full text-center border border-dashed border-[var(--border-color)] text-[var(--text-secondary)] py-3 rounded-lg font-mono"
										style={{ fontSize: TYPOGRAPHY["2xs"] }}
									>
										Acción no requerida en este periodo
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Drenyra voice standard compliance */}
					<div
						className="mt-6 border-t border-[var(--border-color)] pt-4 text-[var(--text-secondary)] italic leading-relaxed"
						style={{ fontSize: TYPOGRAPHY["2xs"] }}
					>
						&ldquo;Preparé el expediente de evidencia de {activeScenario.month} para revisión y control.&rdquo;
					</div>
				</aside>
			</div>

			{/* Component 3: Shadow SUNAT Preview Modal / Overlay */}
			<AnimatePresence>
				{showSunatPreview && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
						onClick={(e) => {
							if (e.target === e.currentTarget) setShowSunatPreview(false);
						}}
					>
						<motion.div
							ref={modalRef}
							role="dialog"
							aria-modal="true"
							aria-label="Vista previa de Shadow SUNAT — comparación de discrepancias"
							tabIndex={-1}
							initial={{ scale: 0.95, y: 10 }}
							animate={{ scale: 1, y: 0 }}
							exit={{ scale: 0.95, y: 10 }}
							className="w-full max-w-2xl rounded-2xl border border-[#2A211B] bg-[#090604] p-5 md:p-6 text-[#EEE0D5] font-mono shadow-2xl relative overflow-hidden outline-none"
						>
							{/* Background evidence grid grid pattern inside the overlay */}
							<div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#EEE0D5_1px,transparent_1px)] bg-[size:16px_16px]" />
							
							{/* Header */}
							<div className="flex items-center justify-between border-b border-[#2A211B] pb-3 mb-4 relative z-10">
								<div className="flex items-center gap-2">
									<Building2 className="h-4 w-4 text-[#FBB974]" />
									<h3
										className="font-black uppercase tracking-widest"
										style={{ fontSize: TYPOGRAPHY.xs }}
									>
										Shadow SUNAT Preview
									</h3>
								</div>
								<button
									type="button"
									onClick={() => setShowSunatPreview(false)}
									className="font-bold uppercase tracking-wider hover:text-white"
									style={{ fontSize: TYPOGRAPHY["2xs"] }}
								>
									Cerrar [ESC]
								</button>
							</div>

							{/* Comparación Table */}
							<div className="space-y-4 relative z-10">
								<p
									className="text-[#CAB6A2] leading-relaxed"
									style={{ fontSize: TYPOGRAPHY["2xs"] }}
								>
									Pre-visualización regulatoria de las discrepancias entre el Registro de Compras (Arkelythex) y la propuesta de SUNAT (SIRE).
								</p>

								<div className="border border-[#2A211B] rounded-lg overflow-hidden bg-[#19120C]/30">
									<div
										className="grid grid-cols-12 gap-2 bg-[#19120C] p-2.5 font-bold border-b border-[#2A211B]"
										style={{ fontSize: TYPOGRAPHY["2xs"] }}
									>
										<div className="col-span-4">CAMPO</div>
										<div className="col-span-4 text-right">PROPUES. SUNAT (SIRE)</div>
										<div className="col-span-4 text-right text-[#FBB974]">ARKELYTHEX PREP.</div>
									</div>
									<div className="p-2 space-y-2">
										{[
											{ field: "Comprobantes CPE", sunat: "1,242 CPE", prep: "1,245 CPE (+3)", mismatch: true },
											{ field: "Base Imponible", sunat: "S/. 428,940.10", prep: "S/. 430,188.50", mismatch: true },
											{ field: "Crédito Fiscal (IGV)", sunat: "S/. 77,209.22", prep: "S/. 78,457.62", mismatch: true },
											{ field: "RUCs Validados", sunat: "No auditados", prep: "100% OK (Branded)", mismatch: false }
										].map((row) => (
											<div
												key={row.field}
												className="grid grid-cols-12 gap-2 py-1.5 border-b border-[#2A211B]/40 last:border-0"
												style={{ fontSize: TYPOGRAPHY["2xs"] }}
											>
												<div className="col-span-4 font-bold">{row.field}</div>
												<div className="col-span-4 text-right text-[#CAB6A2]">{row.sunat}</div>
												<div className={`col-span-4 text-right ${row.mismatch ? "text-[#FFB4AB] font-black" : "text-[#9EC49F]"}`}>
													{row.prep}
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Risks alert list */}
								<div className="rounded-lg bg-[#FFB4AB]/5 border border-[#FFB4AB]/20 p-3.5 space-y-2">
									<h4
										className="font-bold text-[#FFB4AB] uppercase flex items-center gap-1.5"
										style={{ fontSize: TYPOGRAPHY["2xs"] }}
									>
										<AlertCircle className="h-3.5 w-3.5" />
										Riesgo Regulatorio Detectado
									</h4>
									<p
										className="text-[#CAB6A2] leading-relaxed"
										style={{ fontSize: TYPOGRAPHY.xs }}
									>
										Diferencia de 3 CPE y S/. 1,248.40 en IGV. Si declaras con la propuesta del SIRE sin incorporar las referencias de compras omitidas, perderás derecho al crédito fiscal correspondiente. Drenyra ha generado el archivo de ajuste de estructura UBL 2.1 para subsanar.
									</p>
								</div>
							</div>

							{/* Actions */}
							<div className="flex justify-end gap-2 border-t border-[#2A211B] pt-3.5 mt-4 relative z-10">
								<button
									type="button"
									onClick={() => setShowSunatPreview(false)}
									className="px-4 py-2 bg-[#2A211B] hover:bg-[#2A211B]/80 text-[#EEE0D5] font-bold rounded-lg uppercase tracking-wider transition-colors"
									style={{ fontSize: TYPOGRAPHY["2xs"] }}
								>
									Cerrar
								</button>
								<button
									type="button"
									onClick={() => {
										setApprovedMonths((prev) => ({ ...prev, [activeMonth]: true }));
										setShowSunatPreview(false);
									}}
									className="px-4 py-2 bg-[#FBB974] hover:bg-[#FBB974]/90 text-[#090604] font-black rounded-lg uppercase tracking-widest transition-colors shadow-sm"
									style={{ fontSize: TYPOGRAPHY["2xs"] }}
								>
									Sellar Ajuste
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
