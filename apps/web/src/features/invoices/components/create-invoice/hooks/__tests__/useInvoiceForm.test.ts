import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	addFiscalDays,
	formatFiscalDateInput,
	useInvoiceForm,
} from "../useInvoiceForm";

describe("fiscal date helpers", () => {
	it("formats fiscal dates from local calendar parts instead of UTC serialization", () => {
		const localDate = new Date(2026, 1, 28, 23, 30, 0);

		expect(formatFiscalDateInput(localDate)).toBe("2026-02-28");
		expect(formatFiscalDateInput(addFiscalDays(localDate, 30))).toBe(
			"2026-03-30",
		);
	});
});

describe("useInvoiceForm", () => {
	const onSubmit = vi.fn();
	const onSuccess = vi.fn();
	const alertMock = vi.fn();
	const originalTimezone = process.env.TZ;

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal("alert", alertMock);
	});

	afterEach(() => {
		process.env.TZ = originalTimezone;
		vi.unstubAllGlobals();
	});

	it("initializes with expected defaults", () => {
		const { result } = renderHook(() =>
			useInvoiceForm({
				onSubmit,
				onSuccess,
				companyId: "company-123",
			}),
		);

		expect(result.current.formState.series).toBe("F001");
		expect(result.current.formState.currency).toBe("PEN");
		expect(result.current.formState.selectedCustomer).toBeNull();
		expect(result.current.formState.items).toHaveLength(1);
		expect(result.current.formState.items[0]).toMatchObject({
			description: "",
			quantity: 1,
			unitPrice: 0,
			taxType: "GRAVADO",
		});
	});

	it("adds, updates and removes line items", () => {
		const { result } = renderHook(() =>
			useInvoiceForm({
				onSubmit,
				onSuccess,
				companyId: "company-123",
			}),
		);

		const initialId = result.current.formState.items[0].id;

		act(() => {
			result.current.actions.addItem();
		});
		expect(result.current.formState.items).toHaveLength(2);

		act(() => {
			result.current.actions.updateItem(
				initialId,
				"description",
				"Servicio mensual",
			);
			result.current.actions.updateItem(initialId, "quantity", 3);
			result.current.actions.updateItem(initialId, "unitPrice", 45.5);
		});

		const updated = result.current.formState.items.find(
			(item) => item.id === initialId,
		);
		expect(updated).toMatchObject({
			description: "Servicio mensual",
			quantity: 3,
			unitPrice: 45.5,
		});

		const secondId = result.current.formState.items[1].id;
		act(() => {
			result.current.actions.removeItem(secondId);
		});
		expect(result.current.formState.items).toHaveLength(1);

		act(() => {
			result.current.actions.removeItem(initialId);
		});
		expect(result.current.formState.items).toHaveLength(1);
	});

	it("validates customer selection before submit", async () => {
		const { result } = renderHook(() =>
			useInvoiceForm({
				onSubmit,
				onSuccess,
				companyId: "company-123",
			}),
		);

		await act(async () => {
			await result.current.actions.handleSubmit();
		});

		expect(alertMock).toHaveBeenCalledWith("Seleccione un cliente");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("validates line item descriptions before submit", async () => {
		const { result } = renderHook(() =>
			useInvoiceForm({
				onSubmit,
				onSuccess,
				companyId: "company-123",
			}),
		);

		act(() => {
			result.current.actions.setSelectedCustomer({
				id: "cust-1",
				legalName: "Cliente Uno SAC",
				taxId: "20111111111",
			});
		});

		await act(async () => {
			await result.current.actions.handleSubmit();
		});

		expect(alertMock).toHaveBeenCalledWith("Complete las descripciones");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("validates fiscal issue and due dates before submit", async () => {
		const { result } = renderHook(() =>
			useInvoiceForm({
				onSubmit,
				onSuccess,
				companyId: "company-123",
			}),
		);

		act(() => {
			result.current.actions.setSelectedCustomer({
				id: "cust-1",
				legalName: "Cliente Uno SAC",
				taxId: "20111111111",
			});
			result.current.actions.updateItem(
				result.current.formState.items[0].id,
				"description",
				"Servicio profesional",
			);
			result.current.actions.setIssueDate("");
		});

		await act(async () => {
			await result.current.actions.handleSubmit();
		});

		expect(alertMock).toHaveBeenCalledWith(
			"Ingrese una fecha de emisión válida",
		);
		expect(onSubmit).not.toHaveBeenCalled();

		alertMock.mockClear();
		act(() => {
			result.current.actions.setIssueDate("2026-03-20");
			result.current.actions.setDueDate("");
		});

		await act(async () => {
			await result.current.actions.handleSubmit();
		});

		expect(alertMock).toHaveBeenCalledWith(
			"Ingrese una fecha de vencimiento válida",
		);
		expect(onSubmit).not.toHaveBeenCalled();

		alertMock.mockClear();
		act(() => {
			result.current.actions.setDueDate("2026-03-19");
		});

		await act(async () => {
			await result.current.actions.handleSubmit();
		});

		expect(alertMock).toHaveBeenCalledWith(
			"La fecha de vencimiento no puede ser anterior a la emisión",
		);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("accepts valid fiscal dates regardless of UTC offset", async () => {
		process.env.TZ = "Asia/Tokyo";
		onSubmit.mockResolvedValue(undefined);

		const { result } = renderHook(() =>
			useInvoiceForm({
				onSubmit,
				onSuccess,
				companyId: "company-123",
			}),
		);

		act(() => {
			result.current.actions.setSelectedCustomer({
				id: "cust-1",
				legalName: "Cliente Uno SAC",
				taxId: "20111111111",
			});
			result.current.actions.updateItem(
				result.current.formState.items[0].id,
				"description",
				"Servicio profesional",
			);
			result.current.actions.setIssueDate("2026-03-20");
			result.current.actions.setDueDate("2026-04-20");
		});

		await act(async () => {
			await result.current.actions.handleSubmit();
		});

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});
		expect(alertMock).not.toHaveBeenCalled();
		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				issueDate: "2026-03-20",
				dueDate: "2026-04-20",
			}),
		);
	});

	it("submits payload and runs success callback", async () => {
		onSubmit.mockResolvedValue(undefined);

		const { result } = renderHook(() =>
			useInvoiceForm({
				onSubmit,
				onSuccess,
				companyId: "company-123",
			}),
		);

		const firstItemId = result.current.formState.items[0].id;

		act(() => {
			result.current.actions.setSelectedCustomer({
				id: "cust-2",
				legalName: "Cliente Dos SAC",
				taxId: "20999999999",
			});
			result.current.actions.setSeries("B001");
			result.current.actions.setCurrency("USD");
			result.current.actions.setNotes("Factura de prueba");
			result.current.actions.updateItem(
				firstItemId,
				"description",
				"Servicio profesional",
			);
			result.current.actions.updateItem(firstItemId, "quantity", 2);
			result.current.actions.updateItem(firstItemId, "unitPrice", 150);
		});

		await act(async () => {
			await result.current.actions.handleSubmit();
		});

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				companyId: "company-123",
				customerId: "cust-2",
				series: "B001",
				currency: "USD",
				notes: "Factura de prueba",
			}),
		);
		expect(onSuccess).toHaveBeenCalledTimes(1);
	});
});
