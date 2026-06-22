import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  designSystemTokenSections,
  fontTokens,
  globalsRootLiterals,
  radiusTokens,
  spacingTokens,
} from "@/lib/design-system-token-contract";

describe("designSystemTokenSections", () => {
  it("exposes all documented categories in order", () => {
    expect(designSystemTokenSections.map((section) => section.category)).toEqual([
      "neutrals",
      "brand",
      "semantic-states",
      "semantic-colors",
      "radius",
      "fonts",
      "spacing",
    ]);
  });
});

describe("token alignment with globals.css", () => {
  it("stays aligned with :root and @theme declarations", () => {
    const globalsCss = readFileSync(
      resolve(process.cwd(), "app/globals.css"),
      "utf8",
    );

    for (const { name, value } of globalsRootLiterals) {
      expect(globalsCss, `${name}`).toContain(`${name}: ${value};`);
    }

    expect(globalsCss).toContain("--color-primary-rgb: 45, 45, 40;");
  });
});

describe("previews and radius", () => {
  it("documents radius and font tokens with contextual previews", () => {
    expect(radiusTokens[0]).toMatchObject({
      name: "--radius",
      value: "0.625rem",
    });
    expect(fontTokens[0]).toMatchObject({
      name: "--font-sans",
    });
  });

  it("exposes 4pt spacing contract", () => {
    expect(spacingTokens[0]).toEqual(
      expect.objectContaining({ name: "--space-1", value: "4px" }),
    );
  });
});
