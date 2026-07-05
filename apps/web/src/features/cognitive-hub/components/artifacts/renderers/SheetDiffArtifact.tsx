import type { HubArtifact } from "@drenyra/shared/artifacts";
import { Check, Columns3, Diff, ShieldAlert } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";
import { SheetDiffStatusBadge } from "./sheet-diff/SheetDiffStatusBadge";
import { useSheetDiffHotkeys } from "./sheet-diff/useSheetDiffHotkeys";

type SheetDiffArt = Extract<HubArtifact, { type: "sheet_diff" }>;

export const SheetDiffArtifact: React.FC<{ artifact: SheetDiffArt }> = ({
	artifact,
}) => {
	const [accepted, setAccepted] = useState(false);
	const rows = artifact.payload.rows;

	const totals = useMemo(() => {
		const updated = rows.filter((row) => row.status === "updated").length;
		const flagged = rows.filter((row) => row.status === "flagged").length;
		return { updated, flagged };
	}, [rows]);

	const handleAccept = () => {
		setAccepted(true);
	};

	useSheetDiffHotkeys({
		enabled: !accepted,
		onAccept: handleAccept,
	});

	return (
		<section
			className={cn(
				tokensToClasses.borderRadius("card"),
				"mt-6 border border-border/35 bg-background/50 p-5 ",
			)}
		>
			<header className="mb-4 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-foreground/[0.04]">
						<Columns3 size={18} />
					</div>
					<div>
						<h4 className="text-sm font-black uppercase tracking-tight">
							{artifact.title}
						</h4>
						<p className="text-2xs uppercase tracking-widest text-muted-foreground">
							{artifact.payload.sourceName}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 text-2xs uppercase tracking-widest text-muted-foreground">
					<Diff size={12} />
					<span>{artifact.payload.command}</span>
				</div>
			</header>

			<div className="mb-4 grid gap-3 md:grid-cols-3">
				<div className="rounded-xl border border-border/35 bg-background/40 p-3">
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						Registros
					</p>
					<p className="text-lg font-black">{artifact.payload.summary.total}</p>
				</div>
				<div className="rounded-xl border border-border/35 bg-background/40 p-3">
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						Corregidos
					</p>
					<p className="text-lg font-black text-[var(--premium-success)]">
						{totals.updated}
					</p>
				</div>
				<div className="rounded-xl border border-border/35 bg-background/40 p-3">
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						Requieren revisión
					</p>
					<p className="text-lg font-black text-amber-500">{totals.flagged}</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-2xl border border-border/35">
				<div className="grid grid-cols-[1.2fr_1fr_1fr_auto] bg-background/70 px-4 py-2 text-2xs font-black uppercase tracking-widest text-muted-foreground">
					<span>Registro</span>
					<span>Original</span>
					<span>Corregido</span>
					<span>Estado</span>
				</div>
				<div className="max-h-72 divide-y divide-border/25 overflow-auto">
					{rows.map((row) => (
						<div
							key={row.id}
							className="grid grid-cols-[1.2fr_1fr_1fr_auto] items-start gap-3 bg-background/35 px-4 py-3 text-xs"
						>
							<div>
								<p className="font-semibold">{row.record}</p>
								{row.reason ? (
									<p className="mt-1 text-label text-muted-foreground">
										{row.reason}
									</p>
								) : null}
							</div>
							<p className="rounded-lg border border-red-500/25 bg-red-500/5 px-2 py-1 text-red-500">
								{row.original}
							</p>
							<p className="rounded-lg border border-[rgba(var(--premium-success-rgb),0.25)] bg-[rgba(var(--premium-success-rgb),0.05)] px-2 py-1 text-[var(--premium-success)]">
								{row.corrected}
							</p>
							<SheetDiffStatusBadge status={row.status} />
						</div>
					))}
				</div>
			</div>

			<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<ShieldAlert size={14} />
					<span>
						Aceptar cambios con{" "}
						<strong>{artifact.payload.acceptShortcut}</strong>
					</span>
				</div>
				<button
					type="button"
					onClick={handleAccept}
					disabled={accepted}
					className="inline-flex items-center gap-2 rounded-xl border border-[rgba(var(--premium-success-rgb),0.30)] bg-[rgba(var(--premium-success-rgb),0.15)] px-4 py-2 text-xs font-black uppercase tracking-wider text-[var(--premium-success)] transition hover:bg-[rgba(var(--premium-success-rgb),0.25)] disabled:cursor-not-allowed disabled:opacity-60"
				>
					<Check size={14} />
					{accepted ? "Cambios aplicados" : "Aceptar (Ctrl+Enter)"}
				</button>
			</div>
		</section>
	);
};

registerArtifact("sheet_diff", SheetDiffArtifact);
