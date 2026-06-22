/**
 * OseStatusBadge — Status badge for OSE/SUNAT invoice statuses.
 *
 * Uses `getInvoiceOseStatusTone` for semantic class resolution.
 */

import { cn } from "@/lib/utils";
import { getInvoiceOseStatusTone } from "../lib/invoice-ose-status-tone";

interface OseStatusBadgeProps {
	status?: string | null;
	className?: string;
}

export function OseStatusBadge({ status, className }: OseStatusBadgeProps) {
	const tone = getInvoiceOseStatusTone(status);

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide",
				"border",
				tone.badgeClassName,
				className,
			)}
		>
			{tone.label}
		</span>
	);
}
