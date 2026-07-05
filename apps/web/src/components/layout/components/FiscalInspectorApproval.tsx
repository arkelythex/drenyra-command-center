import { Clock, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalSectionProps } from "../FiscalInspector.types";
import { FiscalInspectorSection } from "./FiscalInspectorSection";

/**
 * Shows required approvers and their approval status for high-risk actions.
 */
export function FiscalInspectorApproval({
	requiredApprovers,
	approvedBy,
}: ApprovalSectionProps) {
	return (
		<FiscalInspectorSection title="Aprobación Requerida">
			<div className="space-y-2">
				{requiredApprovers.map((approver) => {
					const hasApproved = approvedBy?.includes(approver);
					return (
						<div
							key={approver}
							className={cn(
								"flex items-center gap-2 rounded-lg border px-3 py-2",
								hasApproved
									? "border-[var(--color-success)]/20 bg-[var(--color-success)]/4"
									: "border-[var(--color-stroke-1)] bg-[var(--color-surface-2)]/30",
							)}
						>
							{hasApproved ? (
								<Fingerprint
									size={14}
									className="text-[var(--color-success)]"
								/>
							) : (
								<Clock size={14} className="text-[var(--color-text-muted)]" />
							)}
							<span
								className={cn(
									"text-2xs font-bold",
									hasApproved
										? "text-[var(--color-success)]"
										: "text-[var(--color-text-secondary)]",
								)}
							>
								{approver}
							</span>
							<span className="text-3xs text-[var(--color-text-muted)] ml-auto">
								{hasApproved ? "Aprobado" : "Pendiente"}
							</span>
						</div>
					);
				})}
			</div>
		</FiscalInspectorSection>
	);
}
