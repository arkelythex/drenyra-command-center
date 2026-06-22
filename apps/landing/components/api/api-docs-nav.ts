export type ApiDocsNavLink = {
	label: string;
	href: string;
	external?: boolean;
};

export type ApiDocsNavSection = {
	label: string;
	links: readonly ApiDocsNavLink[];
};

/** Anchors must exist in `api-page.tsx` (id on section or capability card). */
export const API_DOCS_NAV_SECTIONS: readonly ApiDocsNavSection[] = [
	{
		label: "Primeros pasos",
		links: [
			{ label: "Resumen", href: "#overview" },
			{ label: "Build paths", href: "#build-paths" },
			{ label: "SDKs", href: "#sdks" },
		],
	},
	{
		label: "API Reference",
		links: [
			{ label: "Consultar RUC", href: "#capability-ruc" },
			{ label: "Emitir CPE", href: "#capability-cpe" },
			{ label: "PLE", href: "#capability-ple" },
			{ label: "SIRE", href: "#capability-sire" },
			{ label: "Calendario", href: "#capability-calendario" },
			{ label: "Webhooks", href: "#capability-webhooks" },
		],
	},
	{
		label: "Recursos",
		links: [
			{ label: "Soporte técnico", href: "/demo" },
			{ label: "Cambios y versiones", href: "/docs/roadmap" },
			{
				label: "GitHub",
				href: "https://github.com/arkalythix",
				external: true,
			},
		],
	},
] as const;

export function isApiDocsNavLinkActive(
	href: string,
	pathname: string,
	hash: string,
): boolean {
	if (href.startsWith("#")) {
		const anchor = href.startsWith("#") ? href : `#${href}`;
		if (hash === anchor) {
			return true;
		}
		return hash === "" && anchor === "#overview" && pathname === "/api";
	}

	return pathname === href || pathname.startsWith(`${href}/`);
}
