// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DrenyraPage } from "@/app/drenyra/drenyra-page";

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

vi.mock("next/image", () => ({
	default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock("@/components/ui/scroll-reveal", () => ({
	ScrollReveal: ({
		children,
		className,
	}: {
		children: ReactNode;
		className?: string;
	}) => <div className={className}>{children}</div>,
}));

vi.mock("framer-motion", () => ({
	motion: {
		li: ({ children, ...props }: { children: ReactNode }) => (
			<li {...props}>{children}</li>
		),
		div: ({ children, ...props }: { children: ReactNode }) => (
			<div {...props}>{children}</div>
		),
		span: ({ children, ...props }: { children: ReactNode }) => (
			<span {...props}>{children}</span>
		),
		p: ({ children, ...props }: { children: ReactNode }) => (
			<p {...props}>{children}</p>
		),
	},
	AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("DrenyraPage accessibility", () => {
	afterEach(() => {
		cleanup();
	});

	it("expone CTA principal con target táctil", () => {
		render(<DrenyraPage />);

		const ctaLinks = screen.getAllByRole("link", {
			name: /ver drenyra en acción/i,
		});
		expect(ctaLinks.length).toBeGreaterThan(0);
		for (const link of ctaLinks) {
			expect(link.className).toContain("min-h-11");
			expect(link.getAttribute("href")).toBe("/demo");
		}
	});

	it("expone el hero y mockup del command center", () => {
		render(<DrenyraPage />);

		expect(
			screen.getByRole("heading", {
				name: "Cierra, valida y declara con evidencia fiscal.",
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Cierre fiscal · Mayo 2026" }),
		).toBeTruthy();
		expect(screen.getByText("CPE conciliados")).toBeTruthy();
	});

	it("expone problema, flujo compliance y capacidades", () => {
		render(<DrenyraPage />);

		expect(
			screen.getByRole("heading", {
				name: "El cierre fiscal todavía se arma como una obra sin planos.",
			}),
		).toBeTruthy();
		expect(screen.getByRole("heading", { name: "Validación" })).toBeTruthy();
		expect(screen.getByRole("heading", { name: "Eviden" })).toBeTruthy();
		expect(screen.getByRole("heading", { name: "Vigila" })).toBeTruthy();
	});

	it("expone casos de uso fiscales peruanos", () => {
		render(<DrenyraPage />);
		expect(
			screen.getByRole("heading", {
				name: "Hecho para equipos que viven SUNAT cada mes.",
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Estudio contable multi-RUC" }),
		).toBeTruthy();
		expect(
			screen.getByRole("heading", { name: "Retail y distribución" }),
		).toBeTruthy();
	});

	it("mantiene el CTA secundario del hero apuntando a docs API", () => {
		render(<DrenyraPage />);

		const apiLink = screen.getByRole("link", { name: "Explorar API fiscal" });
		expect(apiLink.getAttribute("href")).toBe("/docs/api");
	});
});
