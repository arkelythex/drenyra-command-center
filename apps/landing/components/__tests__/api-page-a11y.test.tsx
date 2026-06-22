// @vitest-environment happy-dom

import type { ReactNode } from "react";

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ApiPage } from "@/app/api/api-page";

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

vi.mock("@/components/ui/scroll-reveal", () => ({
	ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("ApiPage accessibility", () => {
	afterEach(() => {
		cleanup();
	});

	it.each([
		["Python", "https://github.com/arkalythix/sdk-python"],
		["Node.js", "https://github.com/arkalythix/sdk-node"],
		["Go", "https://github.com/arkalythix/sdk-go"],
		["PHP", "https://github.com/arkalythix/sdk-php"],
	])("labels the %s SDK repository link", (language, href) => {
		render(<ApiPage />);

		const repoLink = screen.getByRole("link", {
			name: `Abrir repositorio GitHub del SDK ${language}`,
		});

		expect(repoLink.getAttribute("href")).toBe(href);
	});

	it("mantiene los tabs de lenguaje por encima del mínimo de target táctil WCAG 2.2", () => {
		render(<ApiPage />);

		const tablist = screen.getByRole("tablist", {
			name: "Lenguaje del ejemplo de código",
		});
		const tabs = tablist.querySelectorAll('[role="tab"]');
		expect(tabs.length).toBe(5);
		for (const tab of tabs) {
			expect(tab.className).toContain("min-h-11");
		}
	});

	it("expone anclas de capacidades alineadas con la navegación lateral", () => {
		render(<ApiPage />);
		expect(document.getElementById("capability-ruc")).not.toBeNull();
		expect(document.getElementById("capability-webhooks")).not.toBeNull();
	});
});
