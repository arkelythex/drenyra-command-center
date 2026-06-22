import type { ReactElement } from "react";

import {
	DRENYRA_KNOT_VIEWBOX,
	DrenyraKnotPaths,
} from "@/components/drenyra/drenyra-knot-paths";

type DrenyraMarkProps = {
	readonly className?: string;
	readonly size?: number;
	readonly variant?: "stroke" | "glass";
};

/** Drenyra product mark — cognitive knot (window chrome, lockup, icon button). */
export function DrenyraMark({
	className = "text-[var(--drenyra-copper)]",
	size = 20,
	variant = "stroke",
}: DrenyraMarkProps): ReactElement {
	if (variant === "glass") {
		return (
			<span
				className={`drenyra-mark-glass inline-flex items-center justify-center ${className}`}
				style={{ width: size, height: size }}
				aria-hidden
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox={DRENYRA_KNOT_VIEWBOX}
					width={size * 0.55}
					height={size * 0.55}
					fill="none"
					stroke="currentColor"
					strokeWidth={1.6}
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<DrenyraKnotPaths />
				</svg>
			</span>
		);
	}

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={DRENYRA_KNOT_VIEWBOX}
			width={size}
			height={size}
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden
		>
			<DrenyraKnotPaths />
		</svg>
	);
}
