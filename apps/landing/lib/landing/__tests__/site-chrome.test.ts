import { describe, expect, it } from "vitest";

import {
	isBrandHome,
	isDocsEntryPath,
	shouldShowConversionChrome,
} from "@/lib/landing/site-chrome";

describe("site-chrome", () => {
	it("trata la home como presentación de marca sin CTAs de conversión", () => {
		expect(isBrandHome("/")).toBe(true);
		expect(shouldShowConversionChrome("/")).toBe(false);
	});

	it("muestra conversión en Drenyra, demo y precios", () => {
		expect(shouldShowConversionChrome("/drenyra")).toBe(true);
		expect(shouldShowConversionChrome("/demo")).toBe(true);
		expect(shouldShowConversionChrome("/precios")).toBe(true);
		expect(shouldShowConversionChrome("/seguridad")).toBe(true);
	});

	it("no muestra conversión en rutas fuera del prefix", () => {
		expect(shouldShowConversionChrome("/sire")).toBe(false);
		expect(shouldShowConversionChrome("/nosotros")).toBe(false);
		expect(shouldShowConversionChrome("/")).toBe(false);
	});

	it("API Docs usa shell de documentación sin CTAs de conversión", () => {
		expect(isDocsEntryPath("/api")).toBe(true);
		expect(shouldShowConversionChrome("/api")).toBe(false);
	});
});
