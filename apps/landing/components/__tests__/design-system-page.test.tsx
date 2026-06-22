import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import DesignSystemPage from "@/app/docs/design-system/page";
import {
	designSystemTokenSections,
	fontTokens,
	neutralColorTokens,
	radiusTokens,
	semanticColorTokens,
} from "@/lib/design-system-token-contract";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: ReactNode;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

function countOccurrences(haystack: string, needle: string): number {
	return haystack.split(needle).length - 1;
}

describe("DesignSystemPage", () => {
	it("renders the token sections with shared primitive composition", () => {
		const html = renderToStaticMarkup(<DesignSystemPage />);

		expect(html).toContain("Arkelythex DS");
		expect(html).toContain("landing / docs");
		expect(html).toContain("Neutros");
		expect(html).toContain("Radius");
		expect(html).toContain("Tipografía");
		expect(html).toContain("Espaciado (4px)");
		expect(
			countOccurrences(
				html,
				"group relative flex flex-col gap-5 overflow-hidden",
			),
		).toBe(designSystemTokenSections.length);
		expect(html).toContain('data-token-category="semantic-colors"');
		expect(html).toContain('data-token-category="radius"');

		for (const section of designSystemTokenSections) {
			expect(html).toContain(section.title);
		}
	});

	it("renders representative tokens with name, value, usage, and preview cues", () => {
		const html = renderToStaticMarkup(<DesignSystemPage />);

		expect(html).toContain(`data-token-name="${semanticColorTokens[0]?.name}"`);
		expect(html).toContain(`data-token-name="${neutralColorTokens[0]?.name}"`);
		expect(html).toContain(
			`style="background:${semanticColorTokens[0]?.swatch}`,
		);

		expect(html).toContain("Base");
		expect(html).toContain(radiusTokens[0]?.preview.label ?? "");
		expect(html).toContain(fontTokens[0]?.preview.sample ?? "");
	});

	it("does not surface removed legacy token names as primary documentation", () => {
		const html = renderToStaticMarkup(<DesignSystemPage />);

		expect(html).toContain(semanticColorTokens[0]?.name ?? "");
		expect(html).toContain(radiusTokens[0]?.name ?? "");
		expect(html).toContain(fontTokens[0]?.name ?? "");

		expect(html).not.toContain("--color-card");
		expect(html).not.toContain("--color-muted");
		expect(html).not.toContain("--color-popover");
	});
});
