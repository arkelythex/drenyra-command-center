/**
 * ChatContextPanel — Panel derecho inteligente.
 *
 * Cambia su contenido según el contexto actual del chat:
 * - Último artifact type: muestra preview contextual
 * - Caso activo: muestra métricas + aprobaciones pendientes
 * - Sin contexto: muestra ayuda / estado del swarm
 *
 * @since Jun 2026
 */

import { useMemo } from "react";
import { Bot, MessageSquare, Pin } from "lucide-react";
import type { ChatContextPanelProps } from "./ChatContextPanel.types";
import { useTranslation } from "../../i18n/i18n";
import { getArtifactSummary, ARTIFACT_TYPE_BADGES } from "./ChatContextPanel.data";
import { ArtifactPreview } from "./components/ArtifactPreview";
import { StreamingStatus } from "./components/StreamingStatus";
import { CasePreview } from "./components/CasePreview";

export function ChatContextPanel({
	context,
	activeArtifact,
	caseDetails,
	pendingApprovalsCount,
	isStreaming,
	pinnedArtifacts,
}: ChatContextPanelProps) {
	const { t } = useTranslation();
	const panelContent = useMemo(() => {
		switch (context) {
			case "streaming":
				return <StreamingStatus />;
			case "artifact":
				return activeArtifact ? (
					<ArtifactPreview artifact={activeArtifact} />
				) : (
					<div className="text-xs text-[var(--text-tertiary)]">
						Seleccioná un artifact para ver el preview.
					</div>
				);
			case "case":
				return caseDetails ? (
					<CasePreview
						caseDetails={caseDetails}
						pendingApprovalsCount={pendingApprovalsCount}
					/>
				) : (
					<div className="text-xs text-[var(--text-tertiary)]">
						Sin caso seleccionado.
					</div>
				);
			default:
				return (
					<div className="space-y-3">
						<div className="flex items-center gap-2 text-xs font-bold text-[var(--text-tertiary)]">
							<MessageSquare size={14} aria-hidden="true" />
							Contexto del chat
						</div>
						<p className="text-2xs leading-relaxed text-[var(--text-tertiary)]">
							El panel derecho muestra previews contextuales según lo que estés
							viendo en el chat. Los diffs, gráficos y dashboards aparecen acá
							cuando el agente los genera.
						</p>
						<div className="flex flex-wrap gap-1.5">
							{ARTIFACT_TYPE_BADGES.map((type) => (
								<span
									key={type}
									className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-2xs text-[var(--text-tertiary)]"
								>
									{type}
								</span>
							))}
						</div>
					</div>
				);
		}
	}, [context, activeArtifact, caseDetails, pendingApprovalsCount, pinnedArtifacts]);

	return (
		<aside
			className="border-l border-[var(--border-subtle)] bg-[var(--surface-2)] p-4"
			aria-label="Panel de contexto del chat"
		>
			<div className="mb-4 flex items-center gap-2">
				<Bot size={16} className="text-[var(--color-info)]" aria-hidden="true" />
				<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
					{isStreaming ? t("context.streaming.title") : "Contexto"}
				</p>
			</div>
			<div
				key={context}
				className="transition-all duration-300 ease-in-out"
				role="region"
				aria-label={
					isStreaming
						? "Estado del agente"
						: context === "artifact"
							? "Vista previa de artifact"
							: context === "case"
								? "Detalles del caso"
								: "Contexto del chat"
				}
			>
				{panelContent}
			</div>
			{pinnedArtifacts.length > 0 && (
				<div
					className="mt-6 border-t border-[var(--border-subtle)] pt-4"
					role="region"
					aria-label="Artifacts anclados"
				>
					<div className="mb-3 flex items-center gap-2">
						<Pin size={12} className="text-[var(--text-tertiary)]" aria-hidden="true" />
						<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
							{t("context.pinned")} ({pinnedArtifacts.length})
						</p>
					</div>
					<div className="space-y-2">
						{pinnedArtifacts.map((artifact) => (
							<div
								key={artifact.id}
								className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2"
							>
								<p className="truncate text-2xs font-medium text-[var(--text-primary)]">
									{artifact.title || artifact.type}
								</p>
								<p className="mt-0.5 text-2xs text-[var(--text-tertiary)]">
									{getArtifactSummary(artifact)}
								</p>
							</div>
						))}
					</div>
				</div>
			)}
		</aside>
	);
}
