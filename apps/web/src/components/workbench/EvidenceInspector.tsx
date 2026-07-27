import {
	CheckCircle,
	ExternalLink,
	FileText,
	Hash,
	ShieldCheck,
	XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EvidenceItem {
	id: string;
	label: string;
	type: "document" | "receipt" | "calculation" | "source" | "policy";
	verified: boolean;
	hash?: string;
	timestamp: string;
	source: string;
	kind: string; // e.g. "Factura", "RCE", "CDR"
}

export interface ProvenanceNode {
	id: string;
	label: string;
	type: "journal_entry" | "diff" | "agent_run" | "approval" | "evidence";
	timestamp: string;
	actor: string;
}

interface EvidenceInspectorProps {
	evidence: EvidenceItem[];
	provenance?: ProvenanceNode[];
	policyRef?: {
		code: string;
		name: string;
		version: string;
		appliedAt: string;
	};
	className?: string;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function EvidenceCard({ item }: { item: EvidenceItem }) {
	const typeColors: Record<string, string> = {
		document: "border-blue-500/20 bg-blue-500/5",
		receipt: "border-green-500/20 bg-green-500/5",
		calculation: "border-purple-500/20 bg-purple-500/5",
		source: "border-amber-500/20 bg-amber-500/5",
		policy: "border-gray-500/20 bg-gray-500/5",
	};

	return (
		<div
			className={cn(
				"rounded-lg border p-2.5",
				typeColors[item.type] ?? typeColors.document,
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-start gap-2 min-w-0">
					<FileText
						size={14}
						className="mt-0.5 shrink-0 text-[var(--text-muted)]"
					/>
					<div className="min-w-0">
						<div className="truncate text-xs font-medium text-[var(--text-primary)]">
							{item.label}
						</div>
						<div className="mt-0.5 text-[10px] text-[var(--text-secondary)]">
							{item.kind} · {item.source}
						</div>
						{item.hash && (
							<div className="mt-0.5 flex items-center gap-1 text-[9px] text-[var(--text-muted)]">
								<Hash size={9} />
								<span className="font-mono">{item.hash.slice(0, 16)}...</span>
							</div>
						)}
					</div>
				</div>

				{item.verified ? (
					<CheckCircle
						size={14}
						className="shrink-0 text-green-500"
						aria-label="Verificada"
					/>
				) : (
					<XCircle
						size={14}
						className="shrink-0 text-amber-500"
						aria-label="Pendiente de verificación"
					/>
				)}
			</div>
		</div>
	);
}

function ProvenanceChain({ nodes }: { nodes: ProvenanceNode[] }) {
	const typeIcons: Record<string, typeof FileText> = {
		journal_entry: FileText,
		diff: FileText,
		agent_run: ShieldCheck,
		approval: CheckCircle,
		evidence: ExternalLink,
	};

	return (
		<div className="space-y-0">
			{nodes.map((node, i) => {
				const Icon = typeIcons[node.type] ?? ExternalLink;
				const isLast = i === nodes.length - 1;

				return (
					<div key={node.id} className="relative flex items-start gap-3 pb-3">
						{/* Connector line */}
						{!isLast && (
							<div className="absolute left-[11px] top-5 bottom-0 w-px bg-[var(--border-subtle)]" />
						)}

						{/* Node dot */}
						<div className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)]">
							<Icon size={10} className="text-[var(--text-muted)]" />
						</div>

						{/* Node content */}
						<div className="min-w-0">
							<div className="text-xs font-medium text-[var(--text-primary)]">
								{node.label}
							</div>
							<div className="text-[10px] text-[var(--text-muted)]">
								{node.actor} ·{" "}
								{new Date(node.timestamp).toLocaleString("es-PE")}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * EvidenceInspector — shows evidence with verification status,
 * provenance chain, and policy reference.
 *
 * Designed for the right panel or a dedicated pane.
 * Each evidence item shows type (document/receipt/calculation/source/policy),
 * verification badge, hash, source.
 */
export function EvidenceInspector({
	evidence,
	provenance,
	policyRef,
	className,
}: EvidenceInspectorProps) {
	const verifiedCount = evidence.filter((e) => e.verified).length;

	return (
		<div className={cn("space-y-4", className)}>
			{/* Summary bar */}
			<div className="flex items-center justify-between rounded-lg bg-[var(--surface-2)] px-3 py-2">
				<span className="text-xs font-medium text-[var(--text-primary)]">
					{evidence.length} {evidence.length === 1 ? "evidencia" : "evidencias"}
				</span>
				<span className="text-[10px] text-green-600">
					{verifiedCount} verificadas
				</span>
			</div>

			{/* Policy reference */}
			{policyRef && (
				<div className="rounded-lg border border-[var(--border-subtle)] p-2.5">
					<div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						<ShieldCheck size={12} /> Política aplicada
					</div>
					<p className="mt-1 text-xs font-medium text-[var(--text-primary)]">
						{policyRef.name}
					</p>
					<p className="text-[10px] text-[var(--text-secondary)]">
						{policyRef.code} v{policyRef.version} ·{" "}
						{new Date(policyRef.appliedAt).toLocaleDateString("es-PE")}
					</p>
				</div>
			)}

			{/* Evidence list */}
			{evidence.length > 0 ? (
				<div className="space-y-2">
					<p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						Documentos soporte
					</p>
					{evidence.map((item) => (
						<EvidenceCard key={item.id} item={item} />
					))}
				</div>
			) : (
				<div className="py-8 text-center text-xs text-[var(--text-muted)]">
					Sin evidencia vinculada
				</div>
			)}

			{/* Provenance chain */}
			{provenance && provenance.length > 0 && (
				<div>
					<p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
						Línea de procedencia
					</p>
					<ProvenanceChain nodes={provenance} />
				</div>
			)}
		</div>
	);
}
