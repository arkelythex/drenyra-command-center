/**
 * ErrorAlert — inline error banner for parse and submission errors.
 */

import { AlertCircle } from "lucide-react";

export interface ErrorAlertProps {
	message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
	return (
		<div className="flex items-start gap-2 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-3">
			<AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" />
			<p className="text-xs text-[var(--color-danger)]">{message}</p>
		</div>
	);
}
