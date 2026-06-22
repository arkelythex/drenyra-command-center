// @vitest-environment happy-dom

import type { ReactNode } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Footer } from "@/components/layout/footer";

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

vi.mock("@/components/newsletter-form-lazy", () => ({
	NewsletterFormLazy: () => <form aria-label="Newsletter" />,
}));

const trackCtaClick = vi.fn();

vi.mock("@/lib/use-analytics", () => ({
	useAnalytics: () => ({ trackCtaClick }),
}));

describe("Footer", () => {
	afterEach(() => {
		cleanup();
		trackCtaClick.mockClear();
	});

	it("renderiza enlaces legales reales sin placeholders", () => {
		render(<Footer />);

		expect(screen.getByRole("link", { name: /^Política de Privacidad$/i }).getAttribute("href")).toBe("/privacy");
		expect(screen.getByRole("link", { name: /^Términos de Servicio$/i }).getAttribute("href")).toBe("/terms");
		expect(screen.getByRole("link", { name: /^Cookies$/i }).getAttribute("href")).toBe("/cookies");
		expect(screen.getByRole("link", { name: /^Legal$/i }).getAttribute("href")).toBe("/legal");
		const contactoLinks = screen.getAllByRole("link", { name: /^Contacto$/i });
		expect(contactoLinks.some((l) => l.getAttribute("href") === "/contact")).toBe(true);
		expect(
			screen.queryByRole("link", { name: /^Reclamaciones$/i }),
		).not.toBeNull();
		expect(document.querySelector('a[href="#"]')).toBeNull();
	});

	it("mantiene los enlaces del footer por encima del mínimo de target WCAG 2.2", () => {
		render(<Footer />);

		for (const name of [
			"Arkelythex en X",
			"Arkelythex en LinkedIn",
			"Arkelythex en GitHub",
		]) {
			const link = screen.getByRole("link", { name });
			expect(link.className).toContain("min-h-6");
			expect(link.className).toContain("min-w-6");
		}

		expect(screen.getByRole("link", { name: /^Inicio$/i }).className).toContain(
			"min-h-6",
		);
		expect(
			screen.getByRole("link", { name: /^Política de Privacidad$/i }).className,
		).toContain("min-h-6");
		expect(
			screen.getByRole("link", { name: /^Reclamaciones$/i }).className,
		).toContain("min-h-6");
		expect(
			screen.getByRole("link", { name: /arkelythexfounders@gmail\.com/i }).className,
		).toContain("min-h-6");
	});
});
