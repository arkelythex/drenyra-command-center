import type { ReactElement } from "react";

import {
	ArkelythexEmblemPaths,
	arkelythexEmblemSvgProps,
} from "@/components/brand/arkelythex-emblem-paths";

type ArkelythexMarkProps = {
	readonly className?: string;
	readonly size?: number;
};

/**
 * Arkelythex institutional emblem — compass rose, diamond core (v0.2).
 * Uses currentColor for theme-aware rendering.
 */
export function ArkelythexMark({
	className = "text-foreground",
	size = 32,
}: ArkelythexMarkProps): ReactElement {
	const strokeProps = arkelythexEmblemSvgProps(1.1);

	return (
		<svg
			{...strokeProps}
			width={size}
			height={size}
			className={className}
			aria-hidden
		>
			<ArkelythexEmblemPaths />
		</svg>
	);
}
