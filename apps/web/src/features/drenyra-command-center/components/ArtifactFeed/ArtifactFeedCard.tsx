import type { HubArtifact } from "@drenyra/shared/artifacts";
import { ARTIFACT_TYPE_COLORS, artifactSummary } from "./ArtifactFeed.data";

interface ArtifactFeedCardProps {
	artifact: HubArtifact;
}

interface FiscalArtifactMetadata {
	source?: string;
	period?: string;
	ruc?: string;
	agent?: string;
	reviewState: string;
}

const REVIEW_REQUIRED_TYPES = new Set<string>([
	"accounting_diff",
	"sheet_diff",
	"banking_reconciliation",
	"tax_summary",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
	return value && typeof value === "object"
		? (value as Record<string, unknown>)
		: null;
}

function getString(
	record: Record<string, unknown> | null,
	key: string,
): string | undefined {
	const value = record?.[key];
	return typeof value === "string" && value.trim().length > 0
		? value
		: undefined;
}

function findString(
	record: Record<string, unknown> | null,
	keys: string[],
): string | undefined {
	if (!record) return undefined;
	for (const key of keys) {
		const direct = getString(record, key);
		if (direct) return direct;
	}
	for (const value of Object.values(record)) {
		const nested = asRecord(value);
		if (!nested) continue;
		const found = findString(nested, keys);
		if (found) return found;
	}
	return undefined;
}

function resolveFiscalMetadata(artifact: HubArtifact): FiscalArtifactMetadata {
	const artifactRecord = asRecord(artifact);
	const payload = asRecord(artifactRecord?.payload);
	const metadata = asRecord(artifactRecord?.metadata);

	return {
		source:
			findString(metadata, ["source", "sourceName"]) ??
			findString(payload, ["source", "sourceName"]),
		period:
			findString(metadata, ["period", "fiscalPeriod"]) ??
			findString(payload, ["period", "fiscalPeriod"]),
		ruc:
			findString(metadata, ["ruc", "companyRuc"]) ??
			findString(payload, ["ruc", "companyRuc"]),
		agent:
			findString(metadata, ["agent", "actor", "generatedBy"]) ??
			findString(payload, ["agent", "actor", "generatedBy"]),
		reviewState: REVIEW_REQUIRED_TYPES.has(artifact.type)
			? "Needs review"
			: "Preview",
	};
}

export function ArtifactFeedCard({ artifact }: ArtifactFeedCardProps) {
	const isEmpty =
		!artifact.title &&
		(artifact.type === "explanation" ? !artifact.content : true);
	if (isEmpty) return null;

	const badgeColor =
		ARTIFACT_TYPE_COLORS[artifact.type] ?? "bg-gray-500/10 text-gray-500";
	const summary = artifactSummary(artifact);
	const fiscal = resolveFiscalMetadata(artifact);
	const fiscalChips = [
		fiscal.ruc ? `RUC ${fiscal.ruc}` : "Fiscal scope pending",
		fiscal.period,
		fiscal.source ? `Source: ${fiscal.source}` : undefined,
		fiscal.agent ? `Agent: ${fiscal.agent}` : undefined,
	].filter((chip): chip is string => Boolean(chip));

	return (
		<div className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
			<div className="flex items-center justify-between gap-2">
				<span
					className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${badgeColor}`}
				>
					{artifact.type}
				</span>
				<span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-2xs font-semibold text-[var(--text-tertiary)]">
					{fiscal.reviewState}
				</span>
			</div>

			{artifact.title && (
				<p className="truncate text-xs font-bold text-[var(--text-primary)]">
					{artifact.title}
				</p>
			)}

			{summary && (
				<p className="line-clamp-2 text-2xs text-[var(--text-tertiary)]">
					{summary}
				</p>
			)}

			<div className="flex flex-wrap gap-1">
				{fiscalChips.map((chip) => (
					<span
						key={chip}
						className="rounded-md bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
					>
						{chip}
					</span>
				))}
			</div>

			<div className="flex items-center gap-2 border-t border-[var(--border-subtle)] pt-2">
				<button
					type="button"
					className="text-[10px] font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--text-primary)]"
				>
					Inspect
				</button>
				<button
					type="button"
					className="text-[10px] font-semibold text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
				>
					Request explanation
				</button>
			</div>
		</div>
	);
}
