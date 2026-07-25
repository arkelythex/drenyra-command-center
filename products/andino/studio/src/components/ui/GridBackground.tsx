import type { ReactNode } from "react";

interface GridBackgroundProps {
	children: ReactNode;
	className?: string;
}

export default function GridBackground({
	children,
	className = "",
}: GridBackgroundProps) {
	return (
		<div className={`relative bg-bg-void grid-pattern ${className}`}>
			{children}
		</div>
	);
}
