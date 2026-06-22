import { describe, expect, it } from "vitest";

import {
	V2_BODY_SECTION_ORDER,
	V2_BODY_SECTION_PURPOSE,
} from "@/lib/landing/section-ids";
import {
	V2_BODY_LAZY_IDS,
	V2_BODY_SECTION_ANCHORS,
	V2_HERO_ANCHOR,
	V2_NAVBAR_LINKS,
	isV2BodySectionLazy,
	resolveV2SectionNavigationTarget,
	v2HashHref,
} from "@/lib/landing/section-registry";

describe("section-registry", () => {
	it("cada sección renderizada del cuerpo tiene ancla no vacía y sin # duplicado en el valor", () => {
		for (const id of V2_BODY_SECTION_ORDER) {
			const anchor = V2_BODY_SECTION_ANCHORS[id];
			expect(anchor.length).toBeGreaterThan(0);
			expect(anchor.startsWith("#")).toBe(false);
		}
	});

	it("hero anchor es estable", () => {
		expect(V2_HERO_ANCHOR).toBe("producto");
	});

	it("navbar tiene 4 enlaces apuntando a rutas de Drenyra", () => {
		expect(V2_NAVBAR_LINKS).toHaveLength(4);
		expect(V2_NAVBAR_LINKS[0]?.label).toBe("Drenyra");
		expect(V2_NAVBAR_LINKS[0]?.href).toBe("/drenyra");
		expect(V2_NAVBAR_LINKS[1]?.label).toBe("Capacidades");
		expect(V2_NAVBAR_LINKS[1]?.href).toBe("/drenyra#drenyra-modulos");
		expect(V2_NAVBAR_LINKS[2]?.label).toBe("Agentes IA");
		expect(V2_NAVBAR_LINKS[2]?.href).toBe("/drenyra#drenyra-agentes");
		expect(V2_NAVBAR_LINKS[3]?.label).toBe("Precios");
		expect(V2_NAVBAR_LINKS[3]?.href).toBe("/drenyra#drenyra-pricing");
	});

	it("lazy ids reflejan que Home Ordered renderiza sus secciones inline", () => {
		expect(V2_BODY_LAZY_IDS).toEqual([]);
		for (const id of V2_BODY_SECTION_ORDER) {
			expect(isV2BodySectionLazy(id)).toBe(false);
		}
	});

	it("hashHref no duplica #", () => {
		expect(v2HashHref("faq")).toBe("#faq");
		expect(v2HashHref("#faq")).toBe("#faq");
	});

	it("resuelve metadata de navegación por hash y cae en null para hashes desconocidos", () => {
		const result = resolveV2SectionNavigationTarget("#why-it-exists");
		expect(result).not.toBeNull();
		expect(result?.anchorId).toBe("why-it-exists");

		expect(resolveV2SectionNavigationTarget("#pricing")).toBeNull();
		expect(resolveV2SectionNavigationTarget("#missing-section")).toBeNull();
	});

	it("BODY_SECTION_ORDER representa las 5 secciones renderizadas del Home", () => {
		expect(V2_BODY_SECTION_ORDER).toEqual([
			"trust-bar",
			"stats",
			"why-it-exists",
			"social-proof",
			"request-access",
		]);
		expect(V2_BODY_SECTION_ORDER).toHaveLength(5);
	});

	it("cada sección en BODY_SECTION_ORDER tiene propósito definido", () => {
		for (const id of V2_BODY_SECTION_ORDER) {
			expect(V2_BODY_SECTION_PURPOSE[id]).toBeDefined();
			expect(V2_BODY_SECTION_PURPOSE[id].length).toBeGreaterThan(0);
		}
	});

	it("todas las secciones renderizadas son eager en el Home actual", () => {
		const eagerSections = V2_BODY_SECTION_ORDER.filter(
			(id) =>
				!V2_BODY_LAZY_IDS.includes(id as (typeof V2_BODY_LAZY_IDS)[number]),
		);
		expect(eagerSections).toEqual(V2_BODY_SECTION_ORDER);
	});
});
