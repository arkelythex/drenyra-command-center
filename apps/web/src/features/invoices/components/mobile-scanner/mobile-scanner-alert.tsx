import type { HTMLAttributes, PropsWithChildren } from "react";

export const ScannerAlert = ({
	className,
	children,
	...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
	<div
		className={`rounded-lg border border-[var(--border-danger)] bg-[var(--surface-danger)]/10 p-4 text-[var(--text-danger)] ${className ?? ""}`}
		{...props}
	>
		{children}
	</div>
);

export const ScannerAlertDescription = ({
	className,
	children,
	...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => (
	<div className={`text-sm ${className ?? ""}`} {...props}>
		{children}
	</div>
);
