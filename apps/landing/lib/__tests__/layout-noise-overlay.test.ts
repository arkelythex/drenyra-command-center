import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("landing root layout noise overlay", () => {
  it("mueve la textura de ruido a CSS y elimina el style inline", () => {
    const currentDir = resolve(import.meta.dirname ?? ".");
    const layoutSource = readFileSync(resolve(currentDir, "../../app/layout.tsx"), "utf8");
    const globalsSource = readFileSync(resolve(currentDir, "../../app/globals.css"), "utf8");

    expect(layoutSource).not.toContain("backgroundImage");
    expect(layoutSource).toContain("landing-noise-overlay");
    expect(globalsSource).toContain(".landing-noise-overlay");
    expect(globalsSource).toContain("position: fixed");
    expect(globalsSource).toContain("inset: 0");
    expect(globalsSource).toContain("z-index: 100");
    expect(globalsSource).toContain("opacity: 0.015");
    expect(globalsSource).toContain("mix-blend-mode: soft-light");
    expect(globalsSource).toContain("background-repeat: repeat");
    expect(globalsSource).toContain("background-image: url(\"data:image/svg+xml,");
  });
});
