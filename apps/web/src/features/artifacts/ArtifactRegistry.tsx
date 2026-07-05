import { Download, ShieldCheck, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
	downloadEncryptedJsonBackup,
	downloadJsonFile,
} from "@/lib/export-utils";
import { cn } from "@/lib/utils";
import { PaymentPreviewArtifactCard } from "./components/PaymentPreviewArtifactCard";
import { SecureBackupDialog } from "./components/SecureBackupDialog";
import { SireDiffArtifactCard } from "./components/SireDiffArtifactCard";
import {
	type ArtifactInteractionEvent,
	isPaymentPreviewArtifact,
	isSireDiffArtifact,
	type WorkspaceArtifact,
} from "./types/artifact.types";

interface ArtifactRegistryProps {
	artifact: WorkspaceArtifact;
	onClose: () => void;
	onEvent: (event: ArtifactInteractionEvent) => void;
}

const statusClassMap: Record<WorkspaceArtifact["status"], string> = {
	PREVIEW: "bg-amber-500/15 text-amber-300 border-amber-400/30",
	COMMITTED:
		"bg-[rgba(var(--premium-success-rgb),0.15)] text-[var(--premium-success)] border-[rgba(var(--premium-success-rgb),0.30)]",
	ROLLED_BACK: "bg-red-500/15 text-red-300 border-red-400/30",
	ERROR: "bg-red-500/20 text-red-200 border-red-500/30",
};

function renderArtifact(
	artifact: WorkspaceArtifact,
	onEvent: (event: ArtifactInteractionEvent) => void,
): ReactNode {
	if (isSireDiffArtifact(artifact)) {
		return <SireDiffArtifactCard artifact={artifact} onEvent={onEvent} />;
	}

	if (isPaymentPreviewArtifact(artifact)) {
		return <PaymentPreviewArtifactCard artifact={artifact} onEvent={onEvent} />;
	}

	return (
		<div className="rounded-2xl border border-border bg-card/70 p-4 text-xs text-muted-foreground">
			Artifact no soportado por el registry actual.
		</div>
	);
}

export const ArtifactRegistry = ({
	artifact,
	onClose,
	onEvent,
}: ArtifactRegistryProps) => {
	const [secureBackupOpen, setSecureBackupOpen] = useState(false);

	const handleBackupDownload = () => {
		const backupPayload = {
			artifact,
			backup: {
				formatVersion: "1.0.0",
				generatedAt: new Date().toISOString(),
				encryption: "bank-grade-at-rest",
			},
		};
		const filename = `artifact-backup-${artifact.type.replace(/\./g, "-")}-${artifact.id}.json`;
		downloadJsonFile(filename, backupPayload);
		onEvent({
			id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
			artifactId: artifact.id,
			artifactType: artifact.type,
			traceId: artifact.metadata.traceId,
			actionId: "download-offline-backup",
			message: "Se descargó backup offline del artifact.",
			createdAt: new Date().toISOString(),
		});
	};

	const handleEncryptedBackupDownload = async (passphrase: string) => {
		const backupPayload = {
			artifact,
			backup: {
				formatVersion: "1.0.0",
				generatedAt: new Date().toISOString(),
				encryption: "aes-gcm-256",
			},
		};
		const filename = `artifact-backup-secure-${artifact.type.replace(/\./g, "-")}-${artifact.id}.json`;

		await downloadEncryptedJsonBackup(filename, backupPayload, passphrase);
		toast.success("Backup cifrado descargado");
		onEvent({
			id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
			artifactId: artifact.id,
			artifactType: artifact.type,
			traceId: artifact.metadata.traceId,
			actionId: "download-offline-backup-encrypted",
			message: "Se descargó backup offline cifrado del artifact.",
			createdAt: new Date().toISOString(),
		});
	};

	return (
		<div className="flex flex-col h-full space-y-6">
			{/* --- INSPECTOR HEADER --- */}
			<header className="flex items-center justify-between">
				<div className="space-y-1">
					<span className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
						Inspector de Evidencia
					</span>
					<h3 className="text-sm font-bold text-primary flex items-center gap-2">
						{artifact.title}
						<Badge
							variant="outline"
							className="text-xs font-mono py-0 h-4 border-gray-100"
						>
							v{artifact.version}
						</Badge>
					</h3>
				</div>
				<button
					onClick={onClose}
					aria-label="Cerrar"
					className="p-1.5 text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
				>
					<X size={16} />
				</button>
			</header>

			{/* --- CORE STATUS & POLICY --- */}
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<Badge
						className={cn(
							"px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border",
							statusClassMap[artifact.status],
						)}
					>
						{artifact.status}
					</Badge>
					{artifact.metadata.policyResult && (
						<Badge
							className={cn(
								"px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border",
								artifact.metadata.policyResult.allowed
									? "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
									: "border-red-100 bg-red-50 text-red-700",
							)}
						>
							Policy: {artifact.metadata.policyResult.allowed ? "OK" : "DENIED"}
						</Badge>
					)}
				</div>

				{artifact.description && (
					<p className="text-xs text-secondary leading-relaxed">
						{artifact.description}
					</p>
				)}
			</div>

			{/* --- AUDIT TRAIL / METADATA --- */}
			<section className="space-y-4 pt-4 border-t border-gray-50">
				<h4 className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
					Traceability
				</h4>
				<div className="space-y-2">
					<MetaRow label="Trace ID" value={artifact.metadata.traceId} mono />
					<MetaRow label="Source" value={artifact.metadata.source} />
					<MetaRow label="Actor" value={artifact.metadata.actor} />
					{artifact.metadata.policyResult?.reason && (
						<div className="mt-2 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
							<p className="text-xs font-medium text-secondary italic">
								"{artifact.metadata.policyResult.reason}"
							</p>
						</div>
					)}
				</div>
			</section>

			{/* --- ARTIFACT CONTENT (PREVIEW/DIFF) --- */}
			<section className="flex-1 min-h-0 pt-4 border-t border-gray-50 overflow-y-auto custom-scrollbar">
				<h4 className="text-xs font-bold text-secondary/40 uppercase tracking-widest mb-4">
					Evidence Content
				</h4>
				{renderArtifact(artifact, onEvent)}
			</section>

			{/* --- ACTION LAYER --- */}
			<footer className="pt-6 border-t border-gray-50 grid grid-cols-2 gap-2">
				<button
					onClick={handleBackupDownload}
					className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-100 text-xs font-bold text-secondary hover:text-primary hover:bg-gray-50 transition-all"
				>
					<Download size={14} />
					Backup
				</button>
				<button
					onClick={() => setSecureBackupOpen(true)}
					className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-xs font-bold text-white hover:bg-black transition-all shadow-sm"
				>
					<ShieldCheck size={14} />
					Cifrar
				</button>
			</footer>

			<SecureBackupDialog
				open={secureBackupOpen}
				onOpenChange={setSecureBackupOpen}
				onConfirm={handleEncryptedBackupDownload}
			/>
		</div>
	);
};

function MetaRow({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4">
			<span className="text-xs font-medium text-secondary/60">{label}</span>
			<span
				className={cn(
					"text-xs font-bold text-primary truncate max-w-[180px]",
					mono && "font-mono text-xs",
				)}
			>
				{value}
			</span>
		</div>
	);
}
