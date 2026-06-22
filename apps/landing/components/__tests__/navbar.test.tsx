// @vitest-environment happy-dom

import type { ReactNode } from "react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";

import { Navbar } from "@/components/navbar";

const mockUseScrollDirection = vi.fn(() => ({
	scrollY: 0,
	isScrolled: false,
	isAtTop: true,
}));
const scrollIntoViewMock = vi.fn();
const usePathnameMock = vi.fn(() => "/");

vi.mock("@/lib/hooks", () => ({
	useScrollDirection: () => mockUseScrollDirection(),
	useScrollSpy: () => null,
	useReducedMotion: () => true,
	useFocusTrap: () => undefined,
}));

vi.mock("next/navigation", () => ({
	usePathname: () => usePathnameMock(),
}));

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

vi.mock("framer-motion", () => ({
	motion: {
		div: ({ children, ...props }: { children: ReactNode }) => (
			<div {...props}>{children}</div>
		),
	},
	AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("Navbar en home (/)", () => {
	beforeEach(() => {
		usePathnameMock.mockReturnValue("/");
		mockUseScrollDirection.mockReturnValue({
			scrollY: 0,
			isScrolled: false,
			isAtTop: true,
		});
		Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
			configurable: true,
			value: scrollIntoViewMock,
		});
		global.IntersectionObserver = class {
			observe() {}
			disconnect() {}
			takeRecords() {
				return [];
			}
			unobserve() {}
		} as unknown as typeof IntersectionObserver;
	});

	afterEach(() => {
		scrollIntoViewMock.mockClear();
		cleanup();
		vi.clearAllMocks();
	});

	it("renderiza enlaces de navegación del home: Drenyra, Precios", () => {
		render(<Navbar />);

		// Textos aparecen en DesktopNav + MobileNav (hidden) → usar getAllByText
		expect(screen.getAllByText("Drenyra").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Precios").length).toBeGreaterThanOrEqual(1);
	});

	it("renderiza Drenyra como link con href /drenyra y Precios como link", () => {
		render(<Navbar />);

		const drenyraLink = screen.getByRole("link", { name: /^Drenyra$/i });
		expect(drenyraLink.getAttribute("href")).toBe("/drenyra");

		const preciosLink = screen.getByRole("link", { name: /^Precios$/i });
		expect(preciosLink.getAttribute("href")).toBe("/precios");

		// En home, Drenyra y Precios son links (no hash buttons)
		expect(
			screen.getByRole("link", { name: /^Drenyra$/i }),
		).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /^Precios$/i }),
		).toBeTruthy();
	});

	it("mantiene targets táctiles WCAG 2.2 en navegación desktop", () => {
		render(<Navbar />);

		// Recolectamos todos los links y botones de navegación
		const allInteractive = [
			...screen.getAllByRole("link"),
			...screen.getAllByRole("button"),
		];
		const navLabels = ["Drenyra", "Precios"];
		for (const label of navLabels) {
			const el = allInteractive.find(
				(el) => el.textContent?.trim() === label,
			);
			expect(el?.className).toContain("min-h-6");
		}
	});

	it("abre el menú móvil y muestra los enlaces de navegación del home", () => {
		render(<Navbar />);

		fireEvent.click(screen.getByRole("button", { name: /abrir menú/i }));

		const mobileMenu = screen.getByRole("dialog", {
			name: /menú de navegación/i,
		});
		expect(mobileMenu).toBeTruthy();

		for (const name of ["Drenyra", "Precios"]) {
			expect(within(mobileMenu).getByText(name)).toBeTruthy();
		}
	});

	it("muestra CTA 'Explorar Drenyra' en el navbar del home", () => {
		render(<Navbar />);

		const cta = screen.getByRole("link", { name: /explorar drenyra/i });
		expect(cta.getAttribute("href")).toBe("/drenyra");
		expect(cta.className).toContain("min-h-11");
	});
});

describe("Navbar en /drenyra", () => {
	beforeEach(() => {
		usePathnameMock.mockReturnValue("/drenyra");
		mockUseScrollDirection.mockReturnValue({
			scrollY: 0,
			isScrolled: false,
			isAtTop: true,
		});
		global.IntersectionObserver = class {
			observe() {}
			disconnect() {}
			takeRecords() {
				return [];
			}
			unobserve() {}
		} as unknown as typeof IntersectionObserver;
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("renderiza enlaces específicos de Drenyra: Drenyra, Capacidades, Agentes IA, Precios", () => {
		render(<Navbar />);

		// Textos aparecen en DesktopNav + MobileNav (hidden)
		expect(screen.getAllByText("Drenyra").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Capacidades").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Agentes IA").length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText("Precios").length).toBeGreaterThanOrEqual(1);
	});

	it("todos los enlaces son links en /drenyra (no hash buttons)", () => {
		render(<Navbar />);

		const links = screen.getAllByRole("link");
		const labels = links.map((l) => l.textContent?.trim()).filter(Boolean);
		expect(labels).toContain("Drenyra");
		expect(labels).toContain("Capacidades");
		expect(labels).toContain("Agentes IA");
		expect(labels).toContain("Precios");
	});
});
