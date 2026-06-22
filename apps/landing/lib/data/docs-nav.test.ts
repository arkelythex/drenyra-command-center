import { describe, expect, it } from "vitest";

import {
  DOCS_PUBLIC_GROUPS,
  getDocsNavContext,
  isDocsNavItemActive,
} from "@/lib/data/docs-nav";

describe("docs-nav", () => {
  it("design system apunta a la ruta dedicada", () => {
    const designSystem = DOCS_PUBLIC_GROUPS[0]?.items[1];

    expect(designSystem?.label).toBe("Design System");
    expect(designSystem?.href).toBe("/docs/design-system");
  });

  it("la ruta design-system se considera activa en la página correcta", () => {
    const designSystem = DOCS_PUBLIC_GROUPS[0]?.items[1];

    expect(designSystem).toBeDefined();
    expect(isDocsNavItemActive(designSystem!, "/docs/design-system", "")).toBe(true);
  });

  it("en design-system no marca la raíz si hay ancla de sección", () => {
    const hubItem = { label: "Índice", href: "/docs/design-system" };

    expect(isDocsNavItemActive(hubItem, "/docs/design-system", "#neutrals")).toBe(false);
    expect(isDocsNavItemActive(hubItem, "/docs/design-system", "")).toBe(true);
  });

  it("resuelve anclas exactas en Media Kit", () => {
    const logos = { label: "Logos", href: "/docs/visuals#logos" };

    expect(isDocsNavItemActive(logos, "/docs/visuals", "#logos")).toBe(true);
    expect(isDocsNavItemActive(logos, "/docs/visuals", "#colores")).toBe(false);
    expect(isDocsNavItemActive(logos, "/docs/visuals", "")).toBe(false);
  });

  it("Vista general del Media Kit solo sin hash", () => {
    const top = { label: "Vista general", href: "/docs/visuals" };

    expect(isDocsNavItemActive(top, "/docs/visuals", "")).toBe(true);
    expect(isDocsNavItemActive(top, "/docs/visuals", "#voz-marca")).toBe(false);
  });

  it("getDocsNavContext usa el shell correcto por ruta", () => {
    expect(getDocsNavContext("/docs/design-system").variant).toBe("design-system");
    expect(getDocsNavContext("/docs/visuals").variant).toBe("media-kit");
    expect(getDocsNavContext("/docs/architecture").variant).toBe("public");
    expect(getDocsNavContext("/docs").variant).toBe("public");
  });
});
