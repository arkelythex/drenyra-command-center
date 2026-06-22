import type { ReactElement, SVGProps } from "react";

/** Institutional compass emblem — diamond core, cardinal rays, nested chevrons (v0.2). */
export function ArkelythexEmblemPaths(): ReactElement {
	return (
		<>
			<path d="M24 22 L26 24 L24 26 L22 24 Z" />
			<line x1="24" y1="22" x2="24" y2="10" />
			<line x1="26" y1="24" x2="38" y2="24" />
			<line x1="24" y1="26" x2="24" y2="38" />
			<line x1="22" y1="24" x2="10" y2="24" />
			{/* Top-right */}
			<line x1="35" y1="11" x2="27" y2="21" />
			<path d="M37 10 L30 17 L28 17 L30 19" />
			<path d="M35 12 L28 19 L26.5 19 L28 21" />
			{/* Top-left */}
			<line x1="13" y1="11" x2="21" y2="21" />
			<path d="M11 10 L18 17 L20 17 L18 19" />
			<path d="M13 12 L20 19 L21.5 19 L20 21" />
			{/* Bottom-right */}
			<line x1="35" y1="37" x2="27" y2="27" />
			<path d="M37 38 L30 31 L28 31 L30 29" />
			<path d="M35 36 L28 29 L26.5 29 L28 27" />
			{/* Bottom-left */}
			<line x1="13" y1="37" x2="21" y2="27" />
			<path d="M11 38 L18 31 L20 31 L18 29" />
			<path d="M13 36 L20 29 L21.5 29 L20 27" />
			<circle cx="24" cy="7" r="1.35" fill="currentColor" stroke="none" />
			<circle cx="41" cy="24" r="1.35" fill="currentColor" stroke="none" />
			<circle cx="24" cy="41" r="1.35" fill="currentColor" stroke="none" />
			<circle cx="7" cy="24" r="1.35" fill="currentColor" stroke="none" />
		</>
	);
}

export const ARKELYTHEX_EMBLEM_VIEWBOX = "0 0 48 48";

export function arkelythexEmblemSvgProps(
	strokeWidth = 1.1,
): Pick<SVGProps<SVGSVGElement>, "viewBox" | "fill" | "xmlns"> & {
	stroke: string;
	strokeWidth: number;
	strokeLinecap: "round";
	strokeLinejoin: "miter";
} {
	return {
		xmlns: "http://www.w3.org/2000/svg",
		viewBox: ARKELYTHEX_EMBLEM_VIEWBOX,
		fill: "none",
		stroke: "currentColor",
		strokeWidth,
		strokeLinecap: "round",
		strokeLinejoin: "miter",
	};
}
