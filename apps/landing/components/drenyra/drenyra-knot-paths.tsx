import type { ReactElement } from "react";

/** Cognitive knot — four interlocking loops, diamond core (brand guide v1). */
export function DrenyraKnotPaths(): ReactElement {
	return (
		<>
			<ellipse cx="28" cy="17" rx="11" ry="8.5" />
			<ellipse cx="28" cy="39" rx="11" ry="8.5" />
			<ellipse cx="17" cy="28" rx="8.5" ry="11" />
			<ellipse cx="39" cy="28" rx="8.5" ry="11" />
			<path d="M28 24.5 L30 28 L28 31.5 L26 28 Z" fill="currentColor" stroke="none" />
		</>
	);
}

export const DRENYRA_KNOT_VIEWBOX = "0 0 56 56";
