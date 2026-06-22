/**
 * CommandCenterChatEmptyState — Empty state with quick-action card grid for
 * the Drenyra Command Center chat, shown when no conversation is active.
 *
 * @since Jun 2026
 */

import {
	BarChart3,
	Bot,
	FileSpreadsheet,
	FileText,
	Receipt,
} from "lucide-react";
import { useTranslation } from "../i18n/i18n";

// ── Props ────────────────────────────────────────────────────────────────────

export interface CommandCenterChatEmptyStateProps {
	sendMessage: (content?: string) => void;
}

// ── Quick Action Card (internal) ─────────────────────────────────────────────

function QuickActionCard({
	icon: Icon,
	title,
	description,
	prompt,
	sendMessage,
}: {
	icon: React.ComponentType<{ size?: number; className?: string }>;
	title: string;
	description: string;
	prompt: string;
	sendMessage: (content?: string) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => sendMessage(prompt)}
			className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/70 p-4 text-left transition hover:border-[var(--color-info)]/40 hover:bg-[var(--surface-1)]"
		>
			<Icon
				size={20}
				className="text-[var(--color-info)]/60 group-hover:text-[var(--color-info)] transition"
				aria-hidden="true"
			/>
			<p className="mt-2 text-sm font-bold text-[var(--text-primary)]">
				{title}
			</p>
			<p className="mt-1 text-2xs text-[var(--text-tertiary)]">{description}</p>
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
			<div className="w-full max-w-lg space-y-6">
				<div className="text-center">
					<Bot
						size={48}
						className="mx-auto text-[var(--color-info)]/60"
						aria-hidden="true"
					/>
					<h3 className="mt-4 text-lg font-bold">{t("chat.empty.title")}</h3>
					<p className="mt-1 text-xs text-[var(--text-secondary)]">
						{t("chat.empty.subtitle")}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<QuickActionCard
						icon={FileSpreadsheet}
						title={t("chat.empty.quick.conciliate")}
						description="Diff automático de cuentas bancarias vs ledger"
						prompt="Conciliame el banco del período activo"
						sendMessage={sendMessage}
					/>
					<QuickActionCard
						icon={FileText}
						title={t("chat.empty.quick.sire")}
						description="Generar declaración con evidencia SUNAT"
						prompt="Prepará el SIRE del período activo"
						sendMessage={sendMessage}
					/>
					<QuickActionCard
						icon={BarChart3}
						title={t("chat.empty.quick.risk")}
						description="Evaluar inconsistencias y anomalías fiscales"
						prompt="Analizá el riesgo fiscal del período"
						sendMessage={sendMessage}
					/>
					<QuickActionCard
						icon={Receipt}
						title={t("chat.empty.quick.igv")}
						description="Verificar IGV 18% y totales de comprobantes"
						prompt="Validá el IGV del período activo"
						sendMessage={sendMessage}
					/>
				</div>

				<div className="text-center">
					<p className="text-2xs text-[var(--text-tertiary)]">
						⌘K para comandos · /ayuda para más opciones
					</p>
				</div>
			</div>
		</div>
	);
}
