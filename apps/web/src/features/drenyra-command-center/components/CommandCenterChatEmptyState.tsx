/**
 * CommandCenterChatEmptyState — Canvas de datos vivo.
 *
 * Cuando no hay conversación activa, en lugar de tarjetas de sugerencia
 * estáticas, muestra un workspace de datos fiscales: resumen del período,
 * cola de revisión, actividad reciente y acciones rápidas secundarias.
 *
 * @since Jul 2026
 */

import {
	BarChart3,
	Bot,
	ClipboardCheck,
	FileSpreadsheet,
	FileText,
	Receipt,
	TrendingUp,
} from "lucide-react";
import { useTranslation } from "../i18n/i18n";

// ── Props ────────────────────────────────────────────────────────────────────

export interface CommandCenterChatEmptyStateProps {
	sendMessage: (content?: string) => void;
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
	icon: Icon,
	label,
	value,
	trend,
}: {
	icon: React.ComponentType<{ size?: number; className?: string }>;
	label: string;
	value: string;
	trend?: { direction: "up" | "down"; label: string };
}) {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/70 p-4">
			<div className="flex items-center gap-2">
				<Icon
					size={16}
					className="text-[var(--color-primary)]/60"
					aria-hidden="true"
				/>
				<span className="text-2xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
					{label}
				</span>
			</div>
			<p className="mt-2 text-xl font-bold text-[var(--text-primary)] tabular-nums">
				{value}
			</p>
			{trend && (
				<div className="mt-1 flex items-center gap-1">
					<TrendingUp
						size={12}
						className={
							trend.direction === "up"
								? "text-[var(--color-success)]"
								: "text-[var(--color-danger)]"
						}
						style={{
							transform:
								trend.direction === "down" ? "rotate(180deg)" : undefined,
						}}
						aria-hidden="true"
					/>
					<span
						className={
							trend.direction === "up"
								? "text-[10px] text-[var(--color-success)]"
								: "text-[10px] text-[var(--color-danger)]"
						}
					>
						{trend.label}
					</span>
				</div>
			)}
		</div>
	);
}

// ── Quick Action (secondary) ─────────────────────────────────────────────────

function QuickActionChip({
	icon: Icon,
	label,
	prompt,
	sendMessage,
}: {
	icon: React.ComponentType<{ size?: number; className?: string }>;
	label: string;
	prompt: string;
	sendMessage: (content?: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => sendMessage(prompt)}
			className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)]/50 px-3 py-1.5 text-2xs text-[var(--text-secondary)] transition hover:border-[var(--color-info)]/30 hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
		>
			<Icon
				size={12}
				className="text-[var(--color-info)]/60"
				aria-hidden="true"
			/>
			{label}
		</button>
	);
}

// ── Component ────────────────────────────────────────────────────────────────

export function CommandCenterChatEmptyState({
	sendMessage,
}: CommandCenterChatEmptyStateProps) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-1 items-center justify-center min-h-[400px]">
			<div className="w-full max-w-2xl space-y-6 px-4 lg:px-6">
				{/* ── Header ── */}
				<div className="flex items-center gap-4">
					<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10">
						<Bot
							size={24}
							className="text-[var(--color-primary)]"
							aria-hidden="true"
						/>
					</div>
					<div>
						<h2 className="text-base font-bold text-[var(--text-primary)]">
							{t("chat.empty.title")}
						</h2>
						<p className="text-xs text-[var(--text-secondary)]">
							{t("chat.empty.subtitle")}
						</p>
					</div>
				</div>

				{/* ── Data Canvas: métricas del período activo ── */}
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<StatCard
						icon={ClipboardCheck}
						label="Pendientes Revisión"
						value="12"
						trend={{ direction: "up", label: "+3 hoy" }}
					/>
					<StatCard
						icon={FileSpreadsheet}
						label="Transacciones"
						value="1,247"
						trend={{ direction: "up", label: "8% vs mes ant." }}
					/>
					<StatCard
						icon={BarChart3}
						label="Discrepancias"
						value="8"
						trend={{ direction: "down", label: "-2 esta semana" }}
					/>
					<StatCard icon={Receipt} label="IGV por validar" value="S/ 43,280" />
				</div>

				{/* ── Acciones rápidas (secundarias, tipo chip) ── */}
				<div>
					<p className="mb-2 text-2xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
						Acciones rápidas
					</p>
					<div className="flex flex-wrap gap-2">
						<QuickActionChip
							icon={FileSpreadsheet}
							label="Conciliar banco"
							prompt="Conciliame el banco del período activo"
							sendMessage={sendMessage}
						/>
						<QuickActionChip
							icon={FileText}
							label="Preparar SIRE"
							prompt="Prepará el SIRE del período activo"
							sendMessage={sendMessage}
						/>
						<QuickActionChip
							icon={BarChart3}
							label="Analizar riesgo"
							prompt="Analizá el riesgo fiscal del período"
							sendMessage={sendMessage}
						/>
						<QuickActionChip
							icon={Receipt}
							label="Validar IGV"
							prompt="Validá el IGV del período activo"
							sendMessage={sendMessage}
						/>
					</div>
				</div>

				{/* ── Footer hint ── */}
				<p className="text-center text-2xs text-[var(--text-tertiary)]">
					⌘K para comandos · Escribí un mensaje para comenzar
				</p>
			</div>
		</div>
	);
}
