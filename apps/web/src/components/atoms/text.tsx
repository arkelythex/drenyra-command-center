import type { ReactNode } from "react";

export function Text({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return <span className={className}>{children}</span>;
}
