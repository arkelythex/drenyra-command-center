import type { CSSProperties, ReactNode } from "react";

interface CardProps {
	children: ReactNode;
	className?: string;
	hover?: boolean;
	style?: CSSProperties;
}

export default function Card({
	children,
	className = "",
	hover = false,
	style,
}: CardProps) {
	return (
		<div
			className={`
        bg-bg-surface border border-border-subtle rounded-[10px]
        ${hover ? "hover:bg-bg-elevated hover:border-border-accent transition-all duration-200 cursor-pointer" : ""}
        ${className}
      `}
			style={style}
		>
			{children}
		</div>
	);
}
