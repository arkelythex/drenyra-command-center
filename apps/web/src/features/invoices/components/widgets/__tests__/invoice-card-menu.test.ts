import { describe, expect, it, vi } from "vitest";
import {
	buildInvoiceMenuGroups,
	type InvoiceMenuInput,
} from "../invoice-card-menu";

const noop = vi.fn();

function input(over: Partial<InvoiceMenuInput> = {}): InvoiceMenuInput {
	return {
		status: "draft",
		hasCdr: false,
		hasTicket: false,
		hasEmail: false,
		isSendingToOse: false,
		isLoadingLifecycle: false,
		isDownloadingPDF: false,
		on: {
			sendToOse: noop,
			loadLifecycle: noop,
			edit: noop,
			openCdr: noop,
			copyTicket: noop,
			previewPDF: noop,
			downloadPDF: noop,
			email: noop,
			remove: noop,
		},
		...over,
	};
}

const ids = (groups: ReturnType<typeof buildInvoiceMenuGroups>) =>
	groups.map((group) => group.map((entry) => entry.id));
const labels = (groups: ReturnType<typeof buildInvoiceMenuGroups>) =>
	groups.flat().map((entry) => entry.label);

describe("buildInvoiceMenuGroups", () => {
	it("offers a draft to be sent, edited or deleted, and nothing about documents", () => {
		const groups = buildInvoiceMenuGroups(input());

		expect(ids(groups)).toEqual([["send"], ["edit"], ["delete"]]);
		expect(labels(groups)).toEqual(["Enviar a OSE", "Editar", "Eliminar"]);
	});

	it("lets an issued invoice be retried, traced and shared, with documents grouped together", () => {
		const groups = buildInvoiceMenuGroups(
			input({ status: "sent", hasCdr: true, hasTicket: true, hasEmail: true }),
		);

		expect(ids(groups)).toEqual([
			["send"],
			["lifecycle"],
			["cdr", "ticket", "preview"],
			["download"],
			["email"],
			["delete"],
		]);
		expect(labels(groups)).toContain("Reintentar OSE");
		expect(labels(groups)).toContain("Ver trazabilidad OSE");
		expect(labels(groups)).toContain("Copiar ticket");
	});

	it("does not offer a resend for a paid invoice, but keeps its documents", () => {
		const groups = buildInvoiceMenuGroups(input({ status: "paid" }));

		expect(ids(groups).flat()).not.toContain("send");
		expect(ids(groups).flat()).toEqual(
			expect.arrayContaining(["lifecycle", "preview", "download", "delete"]),
		);
	});

	it("omits what does not exist: no CDR, no ticket, no customer email", () => {
		const groups = buildInvoiceMenuGroups(input({ status: "sent" }));
		const flat = ids(groups).flat();

		expect(flat).not.toContain("cdr");
		expect(flat).not.toContain("ticket");
		expect(flat).not.toContain("email");
	});

	it("says what is in progress and disables the entry", () => {
		const groups = buildInvoiceMenuGroups(
			input({
				status: "sent",
				isSendingToOse: true,
				isLoadingLifecycle: true,
				isDownloadingPDF: true,
			}),
		);
		const entries = groups.flat();

		expect(entries.find((entry) => entry.id === "send")).toMatchObject({
			label: "Enviando…",
			disabled: true,
		});
		expect(entries.find((entry) => entry.id === "lifecycle")).toMatchObject({
			label: "Cargando…",
			disabled: true,
		});
		expect(entries.find((entry) => entry.id === "download")).toMatchObject({
			label: "Descargando…",
			disabled: true,
		});
	});

	it("marks only deletion as destructive", () => {
		const entries = buildInvoiceMenuGroups(
			input({ status: "sent", hasEmail: true }),
		).flat();

		expect(
			entries.filter((entry) => entry.destructive).map((entry) => entry.id),
		).toEqual(["delete"]);
	});
});
