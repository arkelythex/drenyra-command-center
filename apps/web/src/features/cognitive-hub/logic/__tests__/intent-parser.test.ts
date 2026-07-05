import { describe, expect, it } from "vitest";
import { parseIntent } from "../intent-parser";

describe("parseIntent", () => {
	it("detects command inputs", () => {
		expect(parseIntent("/facturacion/invoices")).toBe("command");
		expect(parseIntent("go")).toBe("command");
	});

	it("detects task-oriented inputs", () => {
		expect(parseIntent("procesa esta factura y audita igv")).toBe("task");
		expect(parseIntent("muéstrame qué estás haciendo")).toBe("task");
	});

	it("classifies long natural language as query", () => {
		expect(
			parseIntent("¿Cómo debería optimizar mi flujo de caja este mes?"),
		).toBe("query");
	});
});
